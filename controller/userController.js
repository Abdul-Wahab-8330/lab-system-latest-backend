const User = require('../models/User');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');





// ============================================
// HELPER: Default Permissions by Role
// ============================================
const getDefaultPermissions = (role) => {
  const defaults = {
    'admin': [
      'dashboard', 'create-test', 'all-tests', 'create-user', 'all-users',
      'references', 'referral-reports', 'edit-lab-info', 'finance-analytics',
      'user-analytics', 'test-analytics', 'patient-analytics', 'inventory',
      'expenses', 'revenue-summary', 'register-patients', 'reg-reports',
      'payments', 'results', 'final-reports'
    ],
    'senior_receptionist': [
      'dashboard', 'revenue-summary', 'expenses', 'inventory',
      'register-patients', 'reg-reports', 'payments', 'final-reports'
    ],
    'junior_receptionist': [
      'dashboard', 'register-patients', 'reg-reports', 'results', 'final-reports'
    ],
    'senior_lab_tech': [
      'dashboard', 'reg-reports', 'results', 'final-reports'
    ],
    'junior_lab_tech': [
      'dashboard', 'reg-reports', 'results', 'final-reports'
    ]
  };
  
  return defaults[role] || [];
};



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

         // ✅ AUTO-ASSIGN PERMISSIONS BASED ON ROLE
        const defaultPermissions = getDefaultPermissions(role);

        const newUser = new User({
            name,
            userName,
            password: hashedPassword,
            role,
            permissions: defaultPermissions  
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

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });

        console.log('Login Successful')
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                userName: user.userName,
                role: user.role,
                permissions: user.permissions
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



// ============================================
// CHANGE PASSWORD - For logged-in user (self)
// ============================================
const changePassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        // Validation: Check all fields are provided
        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validation: Minimum password length (3 characters)
        if (newPassword.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 3 characters long'
            });
        }

        // Find user in database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password is correct
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        user.password = hashedPassword;
        await user.save();

        console.log('Password changed successfully for user:', user.userName);
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
            success: false,
            error: 'Something went wrong' 
        });
    }
};


// ============================================
// RESET PASSWORD - For admin to reset any user's password
// ============================================
const resetUserPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        // Validation: Check all fields are provided
        if (!userId || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'User ID and new password are required'
            });
        }

        // Validation: Minimum password length (3 characters)
        if (newPassword.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 3 characters long'
            });
        }

        // Find user in database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database (no current password verification needed)
        user.password = hashedPassword;
        await user.save();

        console.log('Password reset successfully for user:', user.userName);
        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ 
            success: false,
            error: 'Something went wrong' 
        });
    }
};

// ============================================
// UPDATE USER PERMISSIONS - Admin only
// ============================================
const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions, modifiedBy } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update permissions
    user.permissions = permissions;
    user.lastModifiedBy = {
      userId: modifiedBy.userId,
      name: modifiedBy.name,
      date: new Date()
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      user
    });

  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ 
      success: false,
      error: 'Something went wrong' 
    });
  }
};


module.exports = {
    Register,
    Login,
    getAllUsers,
    deleteUser,
    changePassword,
    resetUserPassword,
    updateUserPermissions
};
