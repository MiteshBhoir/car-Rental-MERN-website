import imageKit from "../configs/imagekit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import fs from "fs";
// API to change role to owner
export const changeRoleToOwner = async (req, res) => {
  try {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { role: "owner" });
    res.json({ success: true, message: "Now you can list cars" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to add car
export const addCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const car = JSON.parse(req.body.carData);
    const imageFile = req.file;

    const fileBuffer = fs.readFileSync(imageFile.path);
    const response = await imageKit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/cars",
    });
    // optimization through imageKit url transformation
    var optimisedImageURl = imageKit.url({
      path: response.filePath,
      transformation: [
        { width: "1280" }, //width resizing
        { quality: "auto" }, //Auto compression
        { format: "webp" }, //convert to modern format
      ],
    });
    const image = optimisedImageURl;
    await Car.create({ ...car, owner: _id, image });
    res.json({ success: true, message: "Car Added" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to list all the cars
export const getOwnerCars = async (req, res) => {
  try {
    const { _id } = req.user;
    const cars = await Car.find({ owner: _id });
    res.json({ success: true, cars });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to toggle acr availability

export const toggleCarAvailability = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    // checking if car belongs to user
    if (car.owner.toString() != _id.toString()) {
      return res.json({ success: false, message: "Unauthorised" });
    }
    car.isAvailable = !car.isAvailable;
    await car.save();
    res.json({ success: true, message: "Availability toggled" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to delete a car
export const deleteCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    // checking if car belongs to user
    if (car.owner.toString() != _id.toString()) {
      return res.json({ success: false, message: "Unauthorised" });
    }
    car.owner = null;
    car.isAvailable = false;
    await car.save();
    res.json({ success: true, message: "Car removed" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user;
    if (role !== "owner") {
      return res.json({ success: false, message: "Unauthorised" });
    }
    const cars = await Car.find({ owner: _id });
    const bookings = await Booking.find({ owner: _id })
      .populate("car")
      .sort({ createdAt: -1 });
    const pendingBooking = await Booking.find({
      owner: _id,
      status: "pending",
    });
    const completedBooking = await Booking.find({
      owner: _id,
      status: "completed",
    });

    // calculate monthly revenue from bookings where status is confirmed
    const monthlyRevenue = bookings
      .slice()
      .filter((booking)=>booking.status === "confirmed")
      .reduce((acc, booking) => acc + booking.price, 0);

    const dashboardData = {
      totalCars: cars.length,
      totalBookings: bookings.length,
      pendingBookings: pendingBooking.length,
      completedBookings: completedBooking.length,
      recentBookings: bookings.slice(0, 3),
      monthlyRevenue,
    };
    res.json({ success: true, dashboardData });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to update user image
export const updateUserImage = async (req, res) => {
  try {
    const { _id } = req.user;
    const imageFile = req.file;

    const fileBuffer = fs.readFileSync(imageFile.path);
    const response = await imageKit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/users",
    });
    // optimization through imageKit url transformation
    var optimisedImageURl = imageKit.url({
      path: response.filePath,
      transformation: [
        { width: "400" }, //width resizing
        { quality: "auto" }, //Auto compression
        { format: "webp" }, //convert to modern format
      ],
    });
    const image = optimisedImageURl;
    await User.findByIdAndUpdate(_id, { image });
    res.json({ success: true, message: "Image updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
