const User = require('../models/User');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');


const Register = async (req, res) => {
    try {
        const { name, userName, password, role } = req.body;
        if (!name || !userName || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }


        const existingUser = await User.findOne({ userName })
        if (existingUser) {
            console.log("User already exists:", existingUser);
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            userName,
            password: hashedPassword,
            role
        });
        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully'
        });
        console.log('User created successfully')
    } catch (error) {
        console.log('error creating user', error)
        res.status(500).json({ error: 'Something went wrong' });
    }
};


const Login = async (req, res) => {
    try {
        const { userName, password } = req.body;

        const user = await User.findOne({ userName });
        if (!user) {
            console.log('user does not exist')
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('invalid credentials')
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

        console.log('Login Successful')
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                userName: user.userName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};


const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}); // exclude passwords
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};




module.exports = {
    Register,
    Login,
    getAllUsers,
    deleteUser
};
