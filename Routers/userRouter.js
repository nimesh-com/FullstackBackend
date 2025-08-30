import express from 'express';
import { createUser, getUser, googleLogin,loginUser, resetPassword, SendOTP, validateOTP} from '../Controllers/userController.js';

const userRouter = express.Router();

userRouter.post('/', createUser);
userRouter.post('/login',loginUser);
userRouter.get('/',getUser);
userRouter.post('/google-login',googleLogin);
userRouter.post('/send-otp',SendOTP);
userRouter.post('/reset-password',resetPassword);
userRouter.post('/validate-otp',validateOTP);


export default userRouter;
