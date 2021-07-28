const express = require('express')
const router=express.Router()
const {readUserProfile,updateUserProfile,forgetPassword,activeForgetPassword}=require('../controller/userController')
const {isAuth,isAdmin}=require('../middleware/authUser')
const {forgetPasswordValidator,loginValidator,forgetPasswordValidationActive}=require('../middleware/validator/signupValidator')
//const jwt=require('express-jwt')

router.get('/user/:id', isAuth ,readUserProfile)
router.put('/user/update', isAuth, isAdmin ,updateUserProfile)
router.post('/user/forget/password',  forgetPasswordValidator ,forgetPassword)
router.post('/user/forget/password/active',forgetPasswordValidationActive,activeForgetPassword)

module.exports=router;