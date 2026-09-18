import nodemailer from "nodemailer";

export class EmailUtil {

    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async sendEmail(
        to: string,
        subject: string,
        message: string
    ) {
        return await this.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: message
        });
    }
}