const moment = require("moment");
var functions = require("./functions");
const multer = require('multer');
const path = require('path');
const { con } = require('../connections/databaseConnection');  // Import the database connection from db.js
const fs = require('fs');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');


// Multer configuration for storing files in memory (RAM)
// const storage = multer.memoryStorage();  // Use memoryStorage to avoid saving files to disk

// const upload = multer({ storage: storage });

module.exports = (app, query, io) => {
// MongoDB URI
const mongoURI = 'mongodb+srv://govindaxportsoft:s2na0T1vufXlajIH@influsway.yyyv9.mongodb.net/?retryWrites=true&w=majority&appName=Influsway';

// MongoDB connection
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Define a simple schema to store file metadata
const FileSchema = new mongoose.Schema({
  originalName: String,
  mimetype: String,
  size: Number,
  fileData: Buffer,  // Store the file as binary data
});

const File = mongoose.model('File', FileSchema);

// Set up Multer for file handling
const storage = multer.memoryStorage();  // Store file in memory (as buffer)
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });  // 5MB limit

// Express app

// Route to handle file upload
// app.post('/chat-app/send-file', upload.array('file'), async (req, res) => {
//   if (!req.files || req.files.length === 0) {
//     return res.status(400).json({ message: 'No files uploaded' });
//   }

//   try {
//     const fileDataPromises = req.files.map(async (file) => {
//       const newFile = new File({
//         originalName: file.originalname,
//         mimetype: file.mimetype,
//         size: file.size,
//         fileData: file.buffer,  // Store file buffer directly in MongoDB
//       });

//       await newFile.save();  // Save the file to MongoDB
//       return newFile;
//     });

//     const savedFiles = await Promise.all(fileDataPromises);

//     // Respond with the saved file IDs
//     const fileIds = savedFiles.map(file => file._id);
//     res.json({ fileIds });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error uploading files', error });
//   }
// });

// app.post('/chat-app/send-file', upload.array('file'), async (req, res) => {
//     console.log("Received request to upload files.");
    
//     if (!req.files || req.files.length === 0) {
//       console.log("No files uploaded.");
//       return res.status(400).json({ message: 'No files uploaded' });
//     }
  
//     try {
//       console.log(`Number of files received: ${req.files.length}`);
  
//       const fileDataPromises = req.files.map(async (file) => {
//         console.log(`Processing file: ${file.originalname}`);
        
//         const newFile = new File({
//           originalName: file.originalname,
//           mimetype: file.mimetype,
//           size: file.size,
//           fileData: file.buffer,  // Store file buffer directly in MongoDB
//         });
  
//         console.log(`Saving file ${file.originalname} to MongoDB...`);
//         await newFile.save();  // Save the file to MongoDB
//         console.log(`File ${file.originalname} saved successfully!`);
        
//         return newFile;
//       });
  
//       const savedFiles = await Promise.all(fileDataPromises);
//       console.log(`All files saved successfully!`);
  
//       // Respond with the saved file IDs
//       const fileIds = savedFiles.map(file => file._id);
//       console.log(`File IDs: ${fileIds.join(", ")}`);
  
//       res.json({ fileIds });
  
//     } catch (error) {
//       console.error("Error during file upload:", error);
//       res.status(500).json({ message: 'Error uploading files', error });
//     }
//   });
app.post('/chat-app/send-file', upload.array('file'), async (req, res) => {
    console.log("Received request to upload files.");

    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
        console.log("No files uploaded.");
        return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
        console.log(`Number of files received: ${req.files.length}`);

        // Process and save files to MongoDB
        const fileDataPromises = req.files.map(async (file) => {
            console.log(`Processing file: ${file.originalname}`);

            // Create a new file entry in MongoDB
            const newFile = new File({
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                fileData: file.buffer,  // Store file buffer directly in MongoDB
            });

            console.log(`Saving file ${file.originalname} to MongoDB...`);
            await newFile.save();  // Save the file to MongoDB
            console.log(`File ${file.originalname} saved successfully!`);

            // Return the saved file
            return newFile;
        });

        // Wait for all files to be processed and saved
        const savedFiles = await Promise.all(fileDataPromises);
        console.log(`All files saved successfully!`);

        // Generate file paths (e.g., "uploads/{filename}")
        const filePaths = savedFiles.map(file => `uploads/${file.originalName}`);
        console.log(`File paths: ${filePaths.join(", ")}`);

        // Respond with the generated file paths
        res.json(filePaths);

    } catch (error) {
        console.error("Error during file upload:", error);
        res.status(500).json({ message: 'Error uploading files', error });
    }
});

  
    app.get("/chat-app", (req, res) => {
        console.log('Received request for /chat-app');
        return res.send("<h4>Welcome this is the live chat app feel free to destroy it </h4>");
    });

// Backend: Make sure you are sending the full file data when requested
app.get("/files/:chatId/:fileName", (req, res) => {
    const { chatId, fileName } = req.params;
    const queryText = 'SELECT file_data, file_name FROM messages WHERE chat_id = ? AND file_name = ? LIMIT 1';
    con.query(queryText, [chatId, fileName], (err, result) => {
        if (err) {
            console.error('Error fetching file from database:', err.message);
            return res.status(500).json({ error: 'Error fetching file from database' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        const fileData = result[0].file_data;
        const fileName = result[0].file_name;
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', fileData.length);  // Ensure the complete file length is sent
        res.send(fileData);
    });
});
// app.get('/chat-app/download-file/:id', async (req, res) => {
//     const fileId = req.params.id;  // Get the file ID from the URL
  
//     try {
//       // Find the file in the database by its ID
//       const file = await File.findById(fileId);
  
//       if (!file) {
//         return res.status(404).json({ message: 'File not found' });
//       }
  
//       // Set appropriate headers for the response to force download
//       res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
//       res.setHeader('Content-Type', file.mimetype);
  
//       // Send the file data as a response
//       res.send(file.fileData);  // This is the binary data from the file buffer
  
//     } catch (error) {
//       console.error('Error during file download:', error);
//       res.status(500).json({ message: 'Error downloading file', error });
//     }
//   });
  
    // app.post("/chat-app/send-file", upload.single('file'), (req, res) => {
    //     console.log("Received file upload request");
    
    //     if (!req.file) {
    //         console.log("No file uploaded");
    //         return res.status(400).json({ error: 'No file uploaded' });
    //     }
    
    //     const fileData = req.file.buffer;
    //     const fileName = req.file.originalname;
    //     const fileSize = req.file.size;
    
    //     console.log('File buffer size:', fileSize);
    //     console.log('File name:', fileName);
    
    //     const chatId = req.body.chat_id;
    //     console.log('//////////////////////////////////', req.body)
    //     const userId = 1;
    //     const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;
    //     const databaseMessage = userId + fileUrl;
    //     console.log(req.body)
    //     if (!chatId) {
    //         console.error("Missing chat_id in the request body");
    //         return res.status(400).json({ error: 'Missing chat_id' });
    //     }
    
    //     // Make sure the file URL has the full URL (with "http://")
    
    //     const queryText = 'INSERT INTO messages (chat_id, message, file_data, file_name) VALUES (?, ?, ?, ?)';
    //     con.query(queryText, [chatId, databaseMessage, fileData, fileName], (err, result) => {
    //         if (err) {
    //             console.error('Error inserting file into database:', err.message);
    //             return res.status(500).json({ error: 'Error storing file information in database' });
    //         }
    
    //         console.log('File data stored in database successfully', result);
    
    //         return res.status(200).json({
    //             message: 'File uploaded and stored in database successfully',
    //             file_url: fileUrl,  // Make sure this URL is correct and complete
    //             chat_id: chatId,
    //             file_name: fileName,
    //             file_size: fileSize,
    //         });
    //     });
    // });
    
    // app.post("/chat-app/send-file", upload.single('file'), (req, res) => {
    //     console.log("Received file upload request");
    
    //     if (!req.file) {
    //         console.log("No file uploaded");
    //         return res.status(400).json({ error: 'No file uploaded' });
    //     }
    
    //     const fileData = req.file.buffer;
    //     const fileName = req.file.originalname;
    //     const fileSize = req.file.size;
    //     const chatId = req.body.chat_id;
        
    //     if (!chatId) {
    //         console.error("Missing chat_id in the request body");
    //         return res.status(400).json({ error: 'Missing chat_id' });
    //     }
    
    //     // Generate file URL
    //     const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;
    //     const databaseMessage = `File: ${fileUrl}`;
    
    //     // Save to the database
    //     const queryText = 'INSERT INTO messages (chat_id, message, file_data, file_name) VALUES (?, ?, ?, ?)';
    //     con.query(queryText, [chatId, databaseMessage, fileData, fileName], (err, result) => {
    //         if (err) {
    //             console.error('Error inserting file into database:', err.message);
    //             return res.status(500).json({ error: 'Error storing file information in database' });
    //         }
    
    //         console.log('File data stored in database successfully', result);
    
    //         // Emit to the socket to notify all users in the chat
    //         io.emit('new-file-message', {
    //             chatId,
    //             message: databaseMessage,
    //             fileUrl,
    //             fileName,
    //             fileSize,
    //             userId: 1, // Use actual user ID
    //         });
    
    //         return res.status(200).json({
    //             message: 'File uploaded and stored in database successfully',
    //             file_url: fileUrl,  // Make sure this URL is correct and complete
    //             chat_id: chatId,
    //             file_name: fileName,
    //             file_size: fileSize,
    //         });
    //     });
    // });

    // app.post("/chat-app/send-file", upload.single('file'), (req, res) => {
    //     console.log("Received file upload request");
    
    //     if (!req.file) {
    //         console.log("No file uploaded");
    //         return res.status(400).json({ error: 'No file uploaded' });
    //     }
    
    //     const fileName = req.file.originalname;
    //     const fileSize = req.file.size;
    //     const chatId = req.body.chat_id;
    
    //     if (!chatId) {
    //         console.error("Missing chat_id in the request body");
    //         return res.status(400).json({ error: 'Missing chat_id' });
    //     }
    
    //     // Generate file URL
    //     const fileUrl = `http://localhost:3000/files/${chatId}/${fileName}`;
    
    //     // Return the file URL and other info to the frontend
    //     return res.status(200).json({
    //         message: 'File uploaded successfully',
    //         file_url: fileUrl,
    //         chat_id: chatId,
    //         file_name: fileName,
    //         file_size: fileSize,
    //     });
    // });

    // const storage = multer.diskStorage({
    //     destination: (req, file, cb) => {
    //         const uploadPath = path.join(__dirname, 'uploads');
    //         if (!fs.existsSync(uploadPath)) {
    //             fs.mkdirSync(uploadPath);
    //         }
    //         cb(null, uploadPath);
    //     },
    //     filename: (req, file, cb) => {
    //         cb(null, `${Date.now()}_${file.originalname}`);
    //     }
    // });

//     const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const uploadPath = path.join(__dirname, 'uploads');
//         if (!fs.existsSync(uploadPath)) {
//             fs.mkdirSync(uploadPath);
//         }
//         cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));  // Preserve the file extension
//     }
// });

// const upload = multer({
//     storage: storage,
//     limits: {
//         fileSize: 5 * 1024 * 1024  // 5MB limit
//     },
//     fileFilter: (req, file, cb) => {
//         const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf'];
//         if (!allowedTypes.includes(file.mimetype)) {
//             return cb(new Error('Invalid file type'), false);
//         }
//         cb(null, true);
//     }
// });
    
//     // const upload = multer({ storage: storage });
//     // const upload = multer({
//     //     dest: path.resolve(__dirname, '../uploads'),  // This resolves the 'uploads' folder in the root
//     // });

//     // const upload = multer({
//     //     dest: path.resolve(__dirname, '../uploads'),
//     //     limits: {
//     //         fileSize: 5 * 1024 * 1024  // 5MB limit in bytes
//     //     },
//     //     fileFilter: (req, file, cb) => {
//     //         const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf'];
//     //         if (!allowedTypes.includes(file.mimetype)) {
//     //             return cb(new Error('Invalid file type'), false);
//     //         }
//     //         cb(null, true);
//     //     }
//     // });
//     app.post('/chat-app/send-file', upload.array('file'), (req, res) => {
//         if (!req.files) {
//             return res.status(400).json({ message: 'No files uploaded' });
//         }
//         console.log(req.files);

//         const filePaths = req.files.map(file => `uploads/${file.filename}`);
//         res.json(filePaths);
//     });

    // Set up custom storage for multer
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         // Set the destination folder for uploaded files
//         cb(null, path.resolve(__dirname, '../uploads'));
//     },
//     filename: (req, file, cb) => {
//         // Preserve the original file name (or you can modify it as needed)
//         const ext = path.extname(file.originalname); // Get the file extension
//         const name = file.originalname.replace(ext, ''); // Get the name without extension
//         const timestamp = Date.now(); // Add timestamp to avoid conflicts
        
//         // You can use a custom naming convention here, e.g. timestamp + original filename
//         cb(null, `${timestamp}_${name}${ext}`); // Save with timestamp + original filename
//     }
// });

// // Set up multer with custom storage and file size limit
// const upload = multer({
//     storage: storage,
//     limits: {
//         fileSize: 5 * 1024 * 1024  // 5MB limit in bytes
//     },
//     fileFilter: (req, file, cb) => {
//         const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf'];
//         if (!allowedTypes.includes(file.mimetype)) {
//             return cb(new Error('Invalid file type'), false);
//         }
//         cb(null, true);
//     }
// });

// // Define the route for file upload
// app.post('/chat-app/send-file', upload.array('file', 3), (req, res) => {
//     if (!req.files || req.files.length === 0) {
//         return res.status(400).json({ error: 'No files uploaded' });
//     }

//     // Generate file paths for each uploaded file
//     const filePaths = req.files.map(file => `/uploads/${file.filename}`);

//     // Return the file paths to the client
//     res.json(filePaths);
// });
    
app.get('/uploads/:originalName', async (req, res) => {
    const originalName = req.params.originalName;  // Get the file originalName from the URL
  
    try {
        // Find the file in the database by its originalName
        const file = await File.findOne({ originalName });  // Query using originalName
  
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
  
        // Set appropriate headers for the response to force download
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimetype);
  
        // Send the file data as a response
        res.send(file.fileData);  // This is the binary data from the file buffer
  
    } catch (error) {
        console.error('Error during file download:', error);
        res.status(500).json({ message: 'Error downloading file', error });
    }
});

    app.get("/chat-app/get-chats", async (req, res) => {
        try {
            const token = req.headers.authorization;
            console.log('Received request to get chats. Token:', token);
            const { data } = await functions.getAuth(token); // authorize the user
            
            if (data.isSuccessful) {
                console.log('User authorized. Fetching chats for user ID:', data.data.id);
                
                query(`SELECT DISTINCT users.user_name, users.id, chats.updated_at, chats.seen, chats.last_message 
                       FROM chats 
                       INNER JOIN users ON chats.user1 = users.id OR chats.user2 = users.id 
                       WHERE (chats.user1 = ${data.data.id}) OR (chats.user2 = ${data.data.id}) 
                       ORDER BY chats.updated_at DESC`, (err, result) => {
                    if (err) {
                        console.error('Error fetching chats:', err.message);
                        return res.status(500).json(err.message);
                    }

                    result = Object.values(JSON.parse(JSON.stringify(result)));
                    result = result.filter(e => { return e.user_name != data.data.user_name });
                    console.log('Chats fetched successfully:', result);
                    return res.json(result);
                });
            } else {
                console.log('User not authorized');
                return res.status(401).json({ result: "not authorized" });
            }
        } catch (error) {
            console.error('Error fetching chats:', error.message);
            return res.json(error.message);
        }
    });

    // app.post("/chat-app/get-chat", async (req, res) => {
    //     console.log('Received request to get chat. Request body:', req.body);
    
    //     try {
    //         const token = req.headers.authorization;
    //         console.log('Authorization token:', token);
    //         console.log('}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}', req.body)
    //         if (!token) {
    //             console.log('Error: Authorization token is missing');
    //             return res.status(400).json({ error: 'Authorization token is missing' });
    //         }
    
    //         let user1, user2;
    //         if (token === "xxxx") {
    //             // Ensure user1 and user2 are numbers here
    //             [user1, user2] = [Number(req.body.user1), Number(req.body.user2)];
    //         } else {
    //             const { data } = await functions.getAuth(token);
    //             if (data && data.data && data.data.id) {
    //                 // Ensure user1 and user2 are numbers
    //                 [user1, user2] = [Number(data.data.id), Number(req.body.user2)];
    //             } else {
    //                 console.log('Error with user data from getAuth:', data);
    //                 return res.status(401).json({ error: 'Invalid token or user data not found' });
    //             }
    //         }
    
    //         if (!user1 || !user2) {
    //             console.log('Error: Missing user1 or user2');
    //             return res.status(400).json({ error: 'Bad request. Please send both user1 and user2.' });
    //         }
    
    //         console.log('Fetching chat between user1:', user1, 'and user2:', user2);
    
    //         const queryText = `
    //             SELECT messages.chat_id, messages.date, messages.message, messages.reply, chats.user1, chats.user2
    //             FROM messages
    //             INNER JOIN chats ON chats.id = messages.chat_id
    //             WHERE ((chats.user1 = ? AND chats.user2 = ?) OR (chats.user1 = ? AND chats.user2 = ?))
    //             ORDER BY messages.date`;
    
    //         query(queryText, [user1, user2, user2, user1], async (err, result) => {
    //             if (err) {
    //                 console.error('Error in query:', err.message);
    //                 return res.status(500).json({ error: 'Database query error', details: err.message });
    //             }
    
    //             if (result.length) {
    //                 // Ensure userNumber is always a number
    //                 let mappedMessage = result.map((message) => {
    //                     const user1Number = Number(message.user1); // Ensure user1 is a number
    //                     const user2Number = Number(message.user2); // Ensure user2 is a number
    //                     if (user1 === user1Number) {
    //                         return { userNumber: 1, ...message };
    //                     } else {
    //                         return { userNumber: 2, ...message };
    //                     }
    //                 });
    
    //                 console.log("Mapped Messages:", mappedMessage);
    //                 return res.json(mappedMessage); // Send mapped response
    //             } else {
    //                 console.log('No existing chat found, creating new chat');
    //                 // Create new chat logic if needed...
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error in post request:', error.message);
    //         return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    //     }
    // });

      app.post("/chat-app/get-chat", async (req, res) => {
        try {
            const token = req.headers.authorization;
            if (token === "xxxx"){
                var [user1, user2] = [ req.body.user1, req.body.user2]
            }else{
                const { data } = await functions.getAuth(token)//authorize the user
                var [user1, user2] = [ data.data.id, req.body.user2]
            }
            if (!user1 || !user2){
                return res.status(400).json("bad request please send user1 and user2")
            }
            //get the chat info 
            query(`SELECT messages.chat_id, messages.date, messages.message, messages.reply, chats.user1, chats.user2  FROM messages INNER JOIN chats on chats.id = messages.chat_id WHERE ((chats.user1 = ${user1} AND chats.user2 = ${user2}) OR (chats.user1 = ${user2} AND chats.user2 = ${user1} ))  Order By messages.date`, async (err, result) => {
                if (err) return res.status(500).json(err.message);
                if( result.length ){//if there is a chat
                    if (user1 == result[0].user1){//if user 1 asked for the chat 
                        result[0] = { userNumber: 1, ...result[0] }
                    }else{//if user 2 asked for the chat
                        result[0] = { userNumber: 2, ...result[0] }
                    }
                    return res.json(result);
                }else{//if there is no chat yet
                    //create chat in the database
                    let created_at = moment().utc().format('YYYY-MM-DD HH:mm')
                    const chat = await query(`insert into chats (user1, user2, last_message, created_at, updated_at) Values (${user1}, ${user2}, ' Chat Created','${created_at}', '${created_at}')`)
                    const chatCreated = await query(`insert into messages (chat_id, message) Values (${chat.insertId}, " 0Chat Created")`)
                    //user1 is the one who started the chat and {userNumber: int} frontend must add it to 'socket auth handshake' and push it at the beginning of each message 
                    return res.json( [{ userNumber: 1, chat_id: chat.insertId, message: " 0Chat Just Created", date: created_at }])
                }
            })
        } catch (error) {
            return res.json(error.message)
        }
    })
    
};
