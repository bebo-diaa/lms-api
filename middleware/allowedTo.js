import AppError from "../utils/AppError.js";
import  {httpStatusText} from '../utils/httpStatusText.js';

const allowedTo = (...roles)=>{


    return (req,res,next)=>{

        if(!roles.includes(req.currentUser.role)){
                    const error = AppError.create("you are not allowed to perform this action ", 403, httpStatusText.FAIL)
                    return next(error);
        }
        next();
    }


}

export{
    allowedTo
}