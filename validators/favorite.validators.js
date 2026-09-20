import {param} from "express-validator";



const favoriteValidator = [

    param("courseId")
        .isMongoId()
        .withMessage("Invalid course ID"),
]


export{
    favoriteValidator
}
