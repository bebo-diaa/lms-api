const CONFIG = {
    baseUrl: "http://localhost:4000/api",
    studentEmail: "teststudent@test.com",
    studentPassword: "12345678",
    courseId: "6a9ba505b7036739cfba05ee", // لازم يكون كورس published:true والطالب مش مسجل فيه
};
 
const log = (title, data) => {
    console.log("\n" + "=".repeat(50));
    console.log(title);
    console.log("=".repeat(50));
    console.log(JSON.stringify(data, null, 2));
};
 
async function run() {
    // 1) Login
    const loginRes = await fetch(`${CONFIG.baseUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: CONFIG.studentEmail,
            password: CONFIG.studentPassword,
        }),
    });
    const loginData = await loginRes.json();
    log("1) LOGIN RESPONSE", loginData);
 
    if (!loginData?.data?.token) {
        console.log("\n❌ فشل تسجيل الدخول. تأكد من الإيميل/الباسورد في CONFIG.");
        return;
    }
 
    const token = loginData.data.token;
    const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
 
    // 2) جرب تجيب الدروس *قبل* الاشتراك (المتوقع: 403)
    const beforeRes = await fetch(
        `${CONFIG.baseUrl}/courses/${CONFIG.courseId}/lessons`,
        { headers: authHeaders }
    );
    const beforeData = await beforeRes.json();
    log(`2) GET LESSONS BEFORE ENROLL (status: ${beforeRes.status})`, beforeData);
 
    if (beforeRes.status === 403) {
        console.log("✅ متوقع: اتمنع لأنه مش مسجل لسه.");
    } else {
        console.log("⚠️ غير متوقع: كان المفروض يترفض بـ 403 لو مش مسجل بالفعل.");
    }
 
    // 3) اعمل enroll
    const enrollRes = await fetch(
        `${CONFIG.baseUrl}/courses/${CONFIG.courseId}/enroll`,
        { method: "POST", headers: authHeaders }
    );
    const enrollData = await enrollRes.json();
    log(`3) ENROLL RESPONSE (status: ${enrollRes.status})`, enrollData);
 
    // 4) جرب تجيب الدروس *بعد* الاشتراك (المتوقع: 200 + array)
    const afterRes = await fetch(
        `${CONFIG.baseUrl}/courses/${CONFIG.courseId}/lessons`,
        { headers: authHeaders }
    );
    const afterData = await afterRes.json();
    log(`4) GET LESSONS AFTER ENROLL (status: ${afterRes.status})`, afterData);
 
    if (afterRes.status === 200) {
        console.log("✅ متوقع: بقى يقدر يشوف الدروس بعد الاشتراك.");
    } else {
        console.log("⚠️ غير متوقع: كان المفروض ينجح بعد الاشتراك.");
    }
 
    console.log("\n" + "=".repeat(50));
    console.log("انتهى الاختبار.");
    console.log("=".repeat(50));
}
 
run().catch((err) => {
    console.error("حصل خطأ غير متوقع أثناء تشغيل السكريبت:", err);
});