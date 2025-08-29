import User from "../Models/users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";

export function createUser(req, res) {
  const passwordHash = bcrypt.hashSync(req.body.password, 10);

  const userData = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: passwordHash,
  };
  const user = new User(userData);

  user
    .save()
    .then(() => {
      res.json({
        message: "User created successfully",
      });
    })
    .catch(() => {
      res.json({
        message: "Error creating user",
      });
    });
}

export function loginUser(req, res) {
  const Email = req.body.email;
  const Password = req.body.password;
  User.findOne({
    email: Email,
  }).then((user) => {
    if (user == null) {
      res.status(404).json({
        message: "User not found",
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
