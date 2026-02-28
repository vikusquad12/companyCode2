import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
    username: {
        type:String,
        required:true
    },
    email: {
        type:String,
        required:true,
        unique:true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    updated_phone: {
        type:String,
        required:false 
    },
    password: {
        type:String,
        required:true
    },
    confirm_password: {
        type:String,
        required:true
    },
    profilePic: {
       type: String,
        default: ""
    }

}, {
    timestamps: true
});


// create a collection

const Register = new mongoose.model("Register", employeeSchema);

// module.exports = Register; --commonjs code
export default Register;