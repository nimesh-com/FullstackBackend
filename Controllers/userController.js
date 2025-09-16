import User from "../Models/users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import e from "cors";
import crypto from "crypto";

import OTP from "../Models/OTP.js";

dotenv.config();

const pwd = "kdedlshgzmdmchzr";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "user.nimesh@gmail.com",
    pass: pwd,
  },
});

export async function createUser(req, res) {
  try {
    // Hash password
    const passwordHash = bcrypt.hashSync(req.body.password, 10);

    // Generate token + expiry
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 3600000; // 1 hour

    // Build user object
    const userData = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: passwordHash,
      token: token,
      tokenExpiration: tokenExpiry,
    };

    // Save user to DB
    const user = new User(userData);
    await user.save();

    // Send verification email
 const message = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #00809D;">Welcome to Our Platform, ${req.body.firstname}!</h2>
    <p>Thank you for registering. To complete your registration and activate your account, please verify your email by clicking the button below:</p>
    <a 
      href="https://fullstackbackend-2uqv.onrender.com/api/users/verify/${token}" 
      style="
        display: inline-block; 
        padding: 12px 25px; 
        margin: 20px 0; 
        font-size: 16px; 
        color: #fff; 
        background-color: #00809D; 
        text-decoration: none; 
        border-radius: 5px;
      "
    >
      Verify Your Account
    </a>
    <p>If you did not register on our platform, please ignore this email.</p>
    <p style="font-size: 12px; color: #999;">This link will expire in 1 hour.</p>
  </div>
`;


    const mailOptions = {
      from: "user.nimesh@gmail.com",
      to: req.body.email,
      subject: "Account Verification",
      html: message,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email error:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    // Success response
    return res.status(201).json({
      message: "User created successfully. Verification email sent.",
    });

  } catch (error) {
    console.error(error);
    return res.status(409).json({
      message: "Error creating user",
      error: error.message,
    });
  }
}

export function verifyUser(req, res) {
  const token = req.params.token;

  User.findOne({ token: token }).then((user) => {
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Mark as verified
    user.isVerified = true;
    user.token = null;
    user.tokenExpiration = null;

    user.save().then(() => {
      // Redirect to frontend dashboard
      res.redirect(`https://fullstack-frontend-alpha-wheat.vercel.app/login?verified=true`);
    }).catch((err) => {
      return res.status(500).send("Error verifying user");
    });
  }).catch((err) => {
    return res.status(500).send("Server error");
  });
}



export function loginUser(req, res) {
  const Email = req.body.email;
  const Password = req.body.password;
  User.findOne({
    email: Email,
  }).then((user) => {
    if (user == null) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (!user.isVerified) {
      return res.status(403).json({
        message: "User is not verified",
      });

    } else {
      const isPasswordValid = bcrypt.compareSync(Password, user.password);
      if (isPasswordValid) {
        const token = jwt.sign(
          {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
          },
          process.env.JWT_SECRET
        );

        res.json({
          token: token,
          role: user.role,
          message: "Login Successful",
        });
      } else {
        res.status(403).json({
          message: "Invalid password",
        });
      }
    }
  });
}

export function isAdmin(req) {
  if (req.user == null) {
    return false;
  }
  if (req.user.role == "admin") {
    return true;
  } else {
    return false;
  }
}

export function getUser(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "Unauthorized",
    });
  } else {
    res.json(req.user);
  }
}

export async function googleLogin(req, res) {
  const googleToken = req.body.token;

  try {
    // Get user info from Google
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${googleToken}`,
        },
      }
    );

    const user = await User.findOne({ email: response.data.email });
    if (!user) {
      const passwordHash = bcrypt.hashSync("123", 10);
      const userData = {
        firstname: response.data.given_name,
        lastname: response.data.family_name,
        email: response.data.email,
        role: "user",
        isVerified: true,
        isBlocked: false,
        password: passwordHash,
      };
      const newUser = new User(userData);
      await newUser.save();
      const token = jwt.sign(
        {
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          email: newUser.email,
          role: "user",
          isVerified: true,
          password: "123",
        },
        process.env.JWT_SECRET
      );
      res.json({
        token: token,
        role: "user",
        message: "Login Successful",
      });
    } else {
      const token = jwt.sign(
        {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET
      );
      res.json({
        token: token,
        role: user.role,
        message: "Login Successful",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error logging in with Google",
    });
  }
}

export async function SendOTP(req, res) {
  const email = req.body.email;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //delete previous OTP if exists
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }
    await OTP.deleteMany({ email: email });
    const newOTP = new OTP({
      email: email,
      otp: otp,
    });
    await newOTP.save();

    const message = {
      from: "user.nimesh@gmail.com",
      to: email,
      subject: "🔑 Password Reset OTP - LuxeAura",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #00809D; margin: 0;">Password Reset Request</h2>
      </div>

      <p style="color: #374151; font-size: 16px;">
        Hello, <br /><br />
        We received a request to reset your password. Please use the following <strong>One-Time Password (OTP)</strong> to proceed:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; background: #00809D; color: #ffffff; font-size: 24px; letter-spacing: 4px; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
          ${otp}
        </span>
      </div>

      <p style="color: #374151; font-size: 14px;">
        This code is valid for <strong>10 minutes</strong>. Do not share it with anyone for security reasons.  
      </p>

      <p style="color: #374151; font-size: 14px;">
        If you did not request a password reset, please ignore this message. Your account is safe.  
      </p>

      <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        Developed by <strong>Nimesh Jayawickrama</strong> <br />
        LuxeAura Cosmetics © ${new Date().getFullYear()}
      </div>
    </div>
  `,
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log("Error sending OTP email:", err);
        res.status(500).json({ message: "Error sending OTP email" });
      } else {
        console.log("OTP email sent:", info.response);
        res.json({ message: "OTP sent successfully" });
      }
    });
  } catch (error) {
    console.log("Error sending OTP email:", error);
    res.status(500).json({ message: "Error sending OTP email" });
  }
}

export async function resetPassword(req, res) {
  const email = req.body.email;
  const otp = req.body.otp;
  const newPassword = req.body.password;
  if (!newPassword)
    return res.status(400).json({ message: "Password is required" });

  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: "Invalid OTP" });

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await User.updateOne({ email }, { password: hashedPassword });
    await OTP.deleteMany({ email });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
}

export async function validateOTP(req, res) {
  const email = req.body.email;
  const otp = req.body.otp;
  const newPassword = req.body.password;
  if (!newPassword)
    return res.status(400).json({ message: "Password is required" });

  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: "Invalid OTP" });
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.log("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
}
