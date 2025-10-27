const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6
    },
    walletAddress: {
      type: String,
      required: [true, "Wallet address is required"],
      unique: true,
      match: /^0x[a-fA-F0-9]{40}$/ // 이더리움 주소 형식
    },
    role: {
      type: String,
      enum: ["user", "external", "register", "company", "admin"],
      default: "user"
    },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// 비밀번호 해싱
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 비밀번호 비교
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
