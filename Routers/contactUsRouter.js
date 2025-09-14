import express from "express";
import { createMessage, deleteMessage, getMessages, statusMessage} from "../Controllers/contactUsController.js";
import { get } from "mongoose";


const contactUsRouter = express.Router();

contactUsRouter.post("/",createMessage);
contactUsRouter.get("/:page/:limit",getMessages);
contactUsRouter.put("/:id",statusMessage);
contactUsRouter.delete("/:id",deleteMessage);


export default contactUsRouter;