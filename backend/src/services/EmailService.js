import nodemailer from "nodemailer";

let transporter = null;
let transporterError = null;

function getTransporter() {
    if (transporter || transporterError) {
        return transporter;
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
        transporterError = new Error(
            "Email is not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASSWORD in backend/.env)."
        );
        return null;
    }

    const port = Number(SMTP_PORT) || 587;

    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD
        }
    });

    return transporter;
}

function buildInviteHtml({ event, participant, acceptUrl, declineUrl }) {
    const details = [
        event.date ? `<strong>Date:</strong> ${event.date}` : null,
        event.venue ? `<strong>Venue:</strong> ${event.venue}` : null
    ].filter(Boolean).join("<br>");

    return `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 28px; color: #1f2937;">
    <h2 style="margin: 0 0 4px; font-size: 20px;">You're Invited</h2>
    <p style="color: #6b7280; margin: 0 0 20px; font-size: 15px;">${event.name}</p>

    <p style="font-size: 14px; line-height: 1.6;">Dear ${participant.full_name},</p>
    ${details ? `<p style="font-size: 14px; line-height: 1.8; color: #4b5563;">${details}</p>` : ""}
    <p style="font-size: 14px; line-height: 1.6;">Please confirm your attendance below.</p>

    <div style="text-align: center; margin: 28px 0;">
        <a href="${acceptUrl}" style="display: inline-block; background: #22c55e; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 0 8px;">Accept</a>
        <a href="${declineUrl}" style="display: inline-block; background: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 0 8px;">Decline</a>
    </div>

    <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Sent via Cadence AI Event Operations.</p>
</div>`.trim();
}

class EmailService {

    async sendRsvpInvite({ event, participant, acceptUrl, declineUrl }) {
        const transport = getTransporter();

        if (!transport) {
            throw transporterError;
        }

        await transport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: participant.email,
            subject: `Invitation: ${event.name}`,
            text: `You are invited to ${event.name}.\n\nAccept: ${acceptUrl}\nDecline: ${declineUrl}`,
            html: buildInviteHtml({ event, participant, acceptUrl, declineUrl })
        });
    }

}

export default EmailService;
