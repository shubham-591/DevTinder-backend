const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength : 4,
        maxLength: 40
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        // immutable: true
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error("Email is not valid")
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if(!validator.isStrongPassword(value)) {
                throw new Error("Password is not strong!!")
            }
        }
    },
    age: {
        type: Number,
        min: 18,
        max: 100
    },
    gender: {
        type: String,
        enum: {
            values: ["male", "female"],
            message: `{VALUE} is not a valid gender type`
        },
        // validate(value) {
        //     if(!["male", "female"].includes(value)) {
        //         throw new Error("Gender data is not valid")
        //     }
        // },
        required: true
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    membershipType: {
        type: String,  
    },
    photoUrl: {
        type: String,
        // default: "https://api.dicebear.com/10.x/lorelei/svg?seed=default",
        default: "https://img.freepik.com/free-vector/user-blue-gradient_78370-4692.jpg?t=st=1740779693~exp=1740783293~hmac=3ffc11733917c931bddeec957e8fa649e6a1590282b3210d816ccbf54dab2e94&w=400",
        validate(value) {
            if(!validator.isURL(value)) {
                throw new Error("Invalid Photo URL: " + value)
            }
        }
    },
    about: {
        type: String,
        default: "This is about page"
    },
    skills: {
        type: [String]
    }
}, {timestamps: true});

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: this._id }, "mySecretKey", {
    expiresIn: "1d",
  });

  return token;
};

userSchema.methods.validatingPassword = async function (passwordInputByUser) {
    const user = this;
    const hashPassword = user.password;
    // console.log(hashPassword);

    const isPasswordValid = await bcrypt.compare(passwordInputByUser, hashPassword);
    // console.log(isPasswordValid)
    return isPasswordValid;
}

const User = mongoose.model("User", userSchema);
module.exports = User;
