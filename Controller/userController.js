const User = require("../Model/userModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Mailgen = require("mailgen");
const nodemailer = require("nodemailer");

//create account
exports.createUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) return res.status(403).json({ message: "email already exist" });

    const newUser = await User.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });
    let config = {
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    };
    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Wellfound",
        link: "https://mailgen.js/",
        copyright: "Copyright © 2023 Wellfound. All rights reserved.",
      },
    });
    let response = {
      body: {
        name: newUser.firstname,
        intro:
          "We are thrilled to have you join us. Verify your email address to get started and access the resources available on our platform.",
        action: {
          instructions: "Click the button below to verify your account:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Verify your account",
            link: ` https://wellfound-gamma.vercel.app/verify/${newUser._id}`,
          },
        },
        signature: "Sincerely",
      },
    };
    let mail = MailGenerator.generate(response);
    let message = {
      from: process.env.EMAIL,
      to: email,
      subject: "Verify email",
      html: mail,
    };
    transporter
      .sendMail(message)
      .then(() => {
        return res.status(200).json({
          message: "success",
        });
      })
      .catch(() => {
        return res.status(404).json({ message: "faileds" });
      });
  } catch (error) {
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};

//resend verification
exports.resendverification = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  let config = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  };
  let transporter = nodemailer.createTransport(config);

  let MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Wellfound",
      link: "https://mailgen.js/",
      copyright: "Copyright © 2023 Wellfound. All rights reserved.",
    },
  });
  let response = {
    body: {
      name: user.firstname,
      intro:
        "We are thrilled to have you join us. Verify your email address to get started and access the resources available on our platform.,",
      action: {
        instructions: "Click the button below to verify your account.:",
        button: {
          color: "#22BC66", // Optional action button color
          text: "Verify your account",
          link: ` https://wellfound-gamma.vercel.app/verify/${user._id}`,
        },
      },
      signature: "Sincerely",
    },
  };
  let mail = MailGenerator.generate(response);
  let message = {
    from: process.env.EMAIL,
    to: email,
    subject: "Verify email",
    html: mail,
  };
  transporter
    .sendMail(message)
    .then(() => {
      return res.status(200).json({
        message: "success",
      });
    })
    .catch(() => {
      return res.status(404).json({ message: "failed" });
    });
};

//email verification
exports.verify = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id);

    if (!user) {
      return res
        .status(403)
        .json({ message: "email does not belong to an existing user" });
    } else if (user.isVerified) {
      return res
        .status(401)
        .json({ status: "error", message: "user already verified" });
    } else {
      const user = await User.findByIdAndUpdate(id, { isVerified: true });

      const accessToken = jwt.sign({ id: user.email }, process.env.JWT_SECRET, {
        expiresIn: "10m",
      });
      const refreshToken = jwt.sign(
        { id: user.email },
        process.env.REFRESH_JWT_SECRET,
        {
          expiresIn: "30m",
        }
      );
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ user, accessToken });
    }
  } catch (error) {
    return res.status(404).json({
      status: "failed",
      message: "login failed",
    });
  }
};

//Login
exports.Login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).exec();
  const match = await user?.comparePassword(password, user.password);

  if (!user) {
    return res
      .status(403)
      .json({ message: "email does not belong to an existing user" });
  } else if (match && !user.isVerified) {
    return res.status(401).json({
      status: "failed",
      message: "please verify your email",
    });
  } else if (!match && !user.isVerified) {
    return res
      .status(400)
      .json({ status: "failed", message: "email or password does not match" });
  }

  if (!match) {
    return res
      .status(400)
      .json({ status: "failed", message: "email or password does not match" });
  } else {
    const accessToken = jwt.sign({ id: user.email }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    const refreshToken = jwt.sign(
      { id: user.email },
      process.env.REFRESH_JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ user, accessToken });
  }
};

//google auth
exports.getOneUser = async (req, res) => {
  const email = req.query.email;
  const accessToken = req.query.token;
  const user = await User.findOne({ email });
  if (user && user.isVerified) {
    const refreshToken = jwt.sign(
      { id: user.email },
      process.env.REFRESH_JWT_SECRET,
      {
        expiresIn: "30m",
      }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ user, accessToken });
  } else if (!user.isVerified) {
    return res.status(401).json({
      status: "failed",
      message: "please verify your email",
    });
  } else {
    return res
      .status(403)
      .json({ message: "email does not belong to an existing user" });
  }
};

//update profile
exports.UpateMe = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndUpdate(req.params.id, {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      confirmPassword: req.body.confirmPassword,
    });
    const match = await user.comparePassword(
      req.body.confirmPassword,
      user.password
    );
    if (!match) {
      return res.status(401).json({ message: "your password is incorrect" });
    }
    res.status(200).json({ message: "profile successfully updated" });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
};

//Logout
exports.LogOut = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204);
  res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "None" });
  return res.json({ message: "cookie cleared" });
};

//forgot password
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .json({ status: "error", message: "user does not exist" });
  } else {
    const reset = user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    let config = {
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    };
    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Wellfound",
        link: "https://mailgen.js/",
        copyright: "Copyright © 2023 Wellfound. All rights reserved.",
      },
    });
    let response = {
      body: {
        name: user.firstname,
        intro: "Someone recently requested that the password be reset,",
        action: {
          instructions: "To reset your password please click this button:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Reset your password",
            link: `https://wellfound-gamma.vercel.app/resetpassword/${user._id}/${reset}`,
          },
        },
        signature: "Sincerely",
        outro:
          "If this is a mistake just ignore this email - your password will not be changed.",
      },
    };
    let mail = MailGenerator.generate(response);
    let message = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reset Password",
      html: mail,
    };
    transporter
      .sendMail(message)
      .then(() => {
        return res.status(200).json({
          message: "success",
        });
      })
      .catch(() => {
        return res.status(404).json({ message: "failed" });
      });
  }
};

//reset password
exports.resetPassword = async (req, res, next) => {
  const id = req.params.id;
  const providedToken = req.params.token;
  const hashOfProvidedToken = crypto
    .createHash("sha256")
    .update(providedToken)
    .digest("hex");

  try {
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "User does not exist" });
    }

    const match = await user.comparePassword(req.body.password, user.password);
    const tokenIsValid = hashOfProvidedToken === user.passwordResetToken;
    const tokenIsExpired = user.passwordResetTokenExpires < Date.now();

    if (match) {
      return res.status(404).json({
        status: "error",
        message: "Password cannot be the same as your previous password",
      });
    }

    if (tokenIsValid && !tokenIsExpired && !match) {
      const newpassword = await user.encryptpassword(
        req.body.password,
        req.body.confirmPassword
      );
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          password: newpassword,
          confirmPassword: undefined,
        },
        { validateBeforeSave: false }
      );

      // Email sending logic
      const config = {
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      };

      const transporter = nodemailer.createTransport(config);

      const currentTimestamp = Date.now();
      const date = new Date(currentTimestamp);
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short",
      };
      const formattedDate = date.toLocaleString("en-US", options);

      const mailGenerator = new Mailgen({
        theme: "default",
        product: {
          name: "Wellfound",
          link: "https://mailgen.js/",
          copyright: "Copyright © 2023 Wellfound. All rights reserved.",
        },
      });

      const response = {
        body: {
          name: user.firstname,
          intro: "You have successfully changed your password",
          dictionary: { date: formattedDate },
          signature: "Sincerely",
          outro: "Didn't do this? Be sure to change your password right away.",
        },
      };

      const mail = mailGenerator.generate(response);
      const message = {
        from: process.env.EMAIL,
        to: user.email,
        subject: `${user.firstname}, your password was successfully reset`,
        html: mail,
      };

      transporter.sendMail(message, (error, info) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .json({ status: "error", message: "Failed to send email" });
        } else {
          return res
            .status(200)
            .json({ status: "success", message: "Password reset successful" });
        }
      });
    } else {
      return res
        .status(400)
        .json({ status: "error", message: "Please reset password" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

exports.getAllUsers = async function(req, res) {
  try {
    const users = await User.find();
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(400).json({ status: "failed" });
  }
};
