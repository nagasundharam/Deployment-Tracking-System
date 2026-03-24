// controllers/projectController.js

import Project from "../models/Project.js";

export const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;

    const projects = await Project.find({
      members: userId
    }).populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      projects
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};