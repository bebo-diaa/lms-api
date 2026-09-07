import jwt from 'jsonwebtoken';

const generateToken = (payload) => {

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET_KEY,
        { expiresIn: "100m" }
    );

    return token;
}

export {
    generateToken
}