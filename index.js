const express = require("express");
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const passwordHash = require('password-hash'); // Import the password-hash library

const app = express();
const port = 3000;
const axios = require('axios');
var serviceAccount = require("./key.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth(); // Initialize Firebase Authentication
// set up ejs
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
// routes
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/signin", (req, res) => {
    res.render("signin");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});
// Task Management
app.get("/tasks", (req, res) => {
    const tasksRef = db.collection("tasks");

    tasksRef
        .get()
        .then((snapshot) => {
            const tasks = [];
            snapshot.forEach((doc) => {
                tasks.push({
                    id: doc.id,
                    name: doc.data().name,
                    description: doc.data().description,
                });
            });
            res.render("tasks", { tasks });
        })
        .catch(() => {
            res.send("An error occurred while fetching tasks");
        });
});

app.get("/addtask", (req, res) => {
    res.render("addtask");
});

app.post("/addtaskSubmit", (req, res) => {
    const tasksRef = db.collection("tasks");

    tasksRef
        .add({
            name: req.body.name,
            description: req.body.description,
        })
        .then(() => {
            res.redirect("/tasks");
        })
        .catch(() => {
            res.send("An error occurred while adding the task");
        });
});

app.get("/edittask/:id", (req, res) => {
    const taskId = req.params.id;
    const tasksRef = db.collection("tasks");

    tasksRef
        .doc(taskId)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                res.send("Task not found");
                return;
            }

            const task = doc.data();
            res.render("edittask", { task, taskId });
        })
        .catch(() => {
            res.send("An error occurred while fetching the task for editing");
        });
});

app.post("/updatetask/:id", (req, res) => {
    const taskId = req.params.id;
    const tasksRef = db.collection("tasks");

    tasksRef
        .doc(taskId)
        .update({
            name: req.body.name,
            description: req.body.description,
        })
        .then(() => {
            res.redirect("/tasks");
        })
        .catch(() => {
            res.send("An error occurred while updating the task");
        });
});

app.get("/deletetask/:id", (req, res) => {
    const taskId = req.params.id;
    const tasksRef = db.collection("tasks");

    tasksRef
        .doc(taskId)
        .delete()
        .then(() => {
            res.redirect("/tasks");
        })
        .catch(() => {
            res.send("An error occurred while deleting the task");
        });
});

app.post("/signupSubmit", async (req, res) => {
    db.collection("users")
        .where("email", "==", req.body.email)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                res.send("The email already exists");
            } else {
                if (req.body.password !== req.body.confirmPassword) {
                    res.send("Passwords do not match");
                    return;
                }
                const hashedPassword = passwordHash.generate(req.body.password);
                db.collection("users")
                    .add({
                        name: req.body.username,
                        email: req.body.email,
                        password: hashedPassword,
                    })
                    .then(() => {
                        res.render("signin");
                    })
                    .catch(() => {
                        res.send("An error occurred while signing up");
                    });
            }
        });
});

app.post("/loginSubmit", function (req, res) {
    db.collection("users")
        .where("email", "==", req.body.email)
        .get()
        .then((docs) => {
            let verified = false;
            docs.forEach((doc) => {
                verified = passwordHash.verify(req.body.password, doc.data().password); 
            });
            if (verified) {
                res.redirect("/tasks");
            } else {
                res.send("Login failed");
            }
        })
        .catch(() => {
            res.send("An error occurred while logging in");
        });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});
