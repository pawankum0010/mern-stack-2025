const mongoose = require('mongoose');

const User = require('../models/user.model');
const Role = require('../models/role.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const { parseDob, calculateAge } = require('../utils/date');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, dob, address, role: requestedRole } =
    req.body;

  if (!name || !email) {
    return sendError(res, {
      message: 'Name and email are required',
      statusCode: 400,
    });
  }

  if (!password) {
    return sendError(res, {
      message: 'Password is required',
      statusCode: 400,
    });
  }

  if (!requestedRole) {
    return sendError(res, {
      message: 'Role is required',
      statusCode: 400,
    });
  }

  let roleDoc;

  if (mongoose.Types.ObjectId.isValid(requestedRole)) {
    roleDoc = await Role.findById(requestedRole);
  } else {
    roleDoc = await Role.findOne({
      name: String(requestedRole).toLowerCase().trim(),
    });
  }

  if (!roleDoc) {
    return sendError(res, {
      message: 'Role not found',
      statusCode: 400,
    });
  }

  const requesterRole = req.requesterRole || (typeof req.user.role === 'string' 
    ? req.user.role.toLowerCase() 
    : req.user.role?.name?.toLowerCase() || '');

  if (!['superadmin', 'admin'].includes(requesterRole)) {
    return sendError(res, {
      message: 'Only superadmin or admin can create users',
      statusCode: 403,
    });
  }

  let dateOfBirth;
  let age;

  if (dob) {
    try {
      dateOfBirth = parseDob(dob);
      age = calculateAge(dateOfBirth);
    } catch (error) {
      return sendError(res, {
        message: error.message,
        statusCode: 400,
      });
    }
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    dateOfBirth,
    age,
    address,
    role: roleDoc._id,
  });

  const populated = await user.populate('role', 'name');

  sendSuccess(res, {
    data: populated,
    message: 'User created successfully',
    statusCode: 201,
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const { email, phone, search, limit = 20 } = req.query;
  
  const query = {};
  
  // Support autocomplete/search with partial matching
  if (search) {
    // Search in email, phone, or name
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];
  } else {
    // Support exact or partial matching for email
    if (email) {
      if (email.includes('@')) {
        // If contains @, try exact match first, then partial
        query.$or = [
          { email: email.toLowerCase() },
          { email: { $regex: email.toLowerCase(), $options: 'i' } },
        ];
      } else {
        // Partial match for email prefix
        query.email = { $regex: email.toLowerCase(), $options: 'i' };
      }
    }
    
    // Support exact or partial matching for phone
    if (phone) {
      query.$or = [
        ...(query.$or || []),
        { phone: phone },
        { phone: { $regex: phone, $options: 'i' } },
      ];
    }
  }
  
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate('role', 'name')
    .select('name email phone address role');

  if (!users.length) {
    return sendNotFound(res, { message: 'No users found' });
  }

  sendSuccess(res, {
    data: users,
    message: 'Records found',
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid user id', statusCode: 400 });
  }

  const user = await User.findById(id).populate('role', 'name');

  if (!user) {
    return sendNotFound(res, { message: 'User not found' });
  }

  sendSuccess(res, {
    data: user,
    message: 'Record found',
  });
});

exports.getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).populate('role', 'name');

  if (!user) {
    return sendNotFound(res, { message: 'User not found' });
  }

  sendSuccess(res, {
    data: user,
    message: 'Profile retrieved successfully',
  });
});

exports.updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { dob, password, profilePicture, ...restUpdates } = req.body;

  const updates = { ...restUpdates };

  if (updates.email) {
    updates.email = updates.email.toLowerCase();
  }

  // Map address.postalCode to pincode if pincode is not provided
  if (updates.address?.postalCode && !updates.pincode) {
    updates.pincode = updates.address.postalCode;
  }

  if (dob) {
    try {
      const dateOfBirth = parseDob(dob);
      updates.dateOfBirth = dateOfBirth;
      updates.age = calculateAge(dateOfBirth);
    } catch (error) {
      return sendError(res, {
        message: error.message,
        statusCode: 400,
      });
    }
  }

  if (profilePicture) {
    updates.profilePicture = profilePicture;
  }

  if (password) {
    updates.password = password;
  }

  let user = await User.findById(userId).select('+password');

  if (!user) {
    return sendNotFound(res, { message: 'User not found' });
  }

  // Preserve pincode if not provided in updates
  if (!updates.pincode && user.pincode) {
    updates.pincode = user.pincode;
  }

  Object.assign(user, updates);
  // Use validateBeforeSave: false for partial updates to avoid validation errors on unchanged required fields
  await user.save({ validateBeforeSave: false });

  const populated = await user.populate('role', 'name');

  sendSuccess(res, {
    data: populated,
    message: 'Profile updated successfully',
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dob, password, role: requestedRole, ...restUpdates } = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid user id', statusCode: 400 });
  }

  const updates = { ...restUpdates };

  if (updates.email) {
    updates.email = updates.email.toLowerCase();
  }

  if (dob) {
    try {
      const dateOfBirth = parseDob(dob);
      updates.dateOfBirth = dateOfBirth;
      updates.age = calculateAge(dateOfBirth);
    } catch (error) {
      return sendError(res, {
        message: error.message,
        statusCode: 400,
      });
    }
  }

  if (password) {
    restUpdates.password = password;
  }

  if (requestedRole) {
    let roleDoc;

    if (mongoose.Types.ObjectId.isValid(requestedRole)) {
      roleDoc = await Role.findById(requestedRole);
    } else {
      roleDoc = await Role.findOne({
        name: String(requestedRole).toLowerCase().trim(),
      });
    }

    if (!roleDoc) {
      return sendError(res, {
        message: 'Role not found',
        statusCode: 400,
      });
    }

    updates.role = roleDoc._id;
  }

  let user = await User.findById(id).select('+password');

  if (!user) {
    return sendNotFound(res, { message: 'User not found' });
  }

  // Preserve pincode if not provided in updates
  if (!updates.pincode && user.pincode) {
    updates.pincode = user.pincode;
  }

  Object.assign(user, updates);
  // Use validateBeforeSave: false for partial updates to avoid validation errors on unchanged required fields
  await user.save({ validateBeforeSave: false });

  const populated = await user.populate('role', 'name');

  sendSuccess(res, {
    data: populated,
    message: 'User updated successfully',
  });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid user id', statusCode: 400 });
  }

  const user = await User.findById(id);
  if (!user) {
    return sendNotFound(res, { message: 'User not found' });
  }

  const requesterRole = req.requesterRole || (typeof req.user.role === 'string' 
    ? req.user.role.toLowerCase() 
    : req.user.role?.name?.toLowerCase() || '');

  const userRoleName = typeof user.role === 'string'
    ? user.role.toLowerCase()
    : user.role?.name?.toLowerCase() || '';

  if (userRoleName === 'superadmin') {
    return sendError(res, {
      message: 'Superadmin account cannot be deleted',
      statusCode: 403,
    });
  }

  if (requesterRole !== 'superadmin') {
    return sendError(res, {
      message: 'Only superadmin can delete users',
      statusCode: 403,
    });
  }

  await User.findByIdAndDelete(id);

  sendSuccess(res, {
    data: null,
    message: 'User deleted successfully',
  });
});
