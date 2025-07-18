import User from "../Models/users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
          "ABC-123"
        );

        res.json({
          token: token,
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
