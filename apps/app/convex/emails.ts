import { Resend } from "@convex-dev/resend";
import { components } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const resend = new Resend(components.resend, {testMode: false});

export const sendPasswordResetEmail = internalAction({
    args: {
        to: v.string(),
        url: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, { to, url }) => {
        const from =
            process.env.RESEND_FROM_EMAIL || "Agroalva <no-reply@agroalva.com.ar>";

        await resend.sendEmail(ctx, {
            from,
            to,
            subject: "Restablecer tu contraseña",
            html: `
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de Agroalva.</p>
                <p>Puedes restablecer tu contraseña haciendo clic en el siguiente enlace:</p>
                <p><a href="${url}">${url}</a></p>
                <p>Si tú no solicitaste este cambio, puedes ignorar este correo.</p>
            `,
        });

        return null;
    },
});


