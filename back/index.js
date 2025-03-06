const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Change this for production
    credentials: true, // Allow cookies to be sent
  }),
);

// Define a type for JWT payload
const authenticateToken = (role = "USER") => {
  return (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: "Access Denied" });
      return;
    }

    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        res.status(400).json({ error: "Invalid Token" });
        return;
      }

      if (role === "ADMIN" && decoded.role !== "ADMIN") {
        res.status(403).json({ error: "Access Denied: Admins only" });
        return;
      }

      next();
    } catch (err) {
      res.status(400).json({ error: "Invalid Token" });
    }
  };
};

app.post("/signup", async (req, res) => {
  const { email, password, role = "USER" } = req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role },
    });
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      throw new Error("SECRET_KEY is not defined in environment variables");
    }
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secretKey,
      {
        expiresIn: "1h",
      },
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Signup Error:", error);

    // Check if the error is related to the user already existing
    if (error.message.includes("User already exists")) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Handle other errors
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login (Signin) with Try/Catch
app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "User not found" }); // Return early if user is not found
    }

    // Compare the provided password with the hashed password in the database
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" }); // Return early if password is invalid
    }

    // Generate a JWT token
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      throw new Error("SECRET_KEY is not defined in environment variables");
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secretKey,
      {
        expiresIn: "1h",
      },
    );

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Return success response
    return res.json({ message: "Login successful", user });
  } catch (error) {
    console.error("Signin Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Logout (Clears the cookie)
app.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  res.json({ message: "Logged out successfully" });
});

// Create a Ticket (Protected Route)
app.post("/tickets", authenticateToken(), async (req, res) => {
  const { title, description } = req.body;
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Access Denied" });
  const decoded = jwt.decode(token);
  if (!decoded) {
    return res.status(400).json({ error: "Invalid Token" });
  }
  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      userId: decoded.userId,
    },
  });

  res.json(ticket);
});

// Get All Tickets (Admin Only)
app.get("/tickets", authenticateToken("ADMIN"), async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany();
    res.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/userTickets", authenticateToken(), async (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Access Denied" });
  }

  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.status(400).json({ error: "Invalid Token" });
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: decoded.userId },
    });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Update Ticket Status (Admin Only)
app.patch(
  "/tickets/:id/status",
  authenticateToken("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["OPEN", "IN_PROGRESS", "CLOSED"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const ticket = await prisma.ticket.update({
        where: { id },
        data: { status },
      });

      res.json({ message: "Ticket status updated successfully", ticket });
    } catch (error) {
      console.error("Update Ticket Status Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);
app.get("/auth-status", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.json({ authenticated: false });
    }

    return res.json({ authenticated: true, user: decoded });
  } catch (err) {
    return res.json({ authenticated: false });
  }
});
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
