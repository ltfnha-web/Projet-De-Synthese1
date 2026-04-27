<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Réinitialisation de mot de passe</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          {{-- Header --}}
          <tr>
            <td style="background:#111111;border-radius:14px 14px 0 0;padding:28px 36px;text-align:center;">
              <div style="display:inline-block;margin-bottom:12px;">
                <div style="background:#22c55e;width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#111;line-height:48px;text-align:center;">
                  I
                </div>
              </div>
              <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;margin-bottom:4px;">
                ISTA Hay Salam
              </div>
              <div style="color:#9ca3af;font-size:12px;letter-spacing:1px;text-transform:uppercase;">
                CF SALE I
              </div>
            </td>
          </tr>

          {{-- Body --}}
          <tr>
            <td style="background:#ffffff;padding:36px 36px 28px;">

              <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#18181b;">
                Bonjour, {{ $user->name }} ,
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.65;">
                Vous avez demandé la réinitialisation de votre mot de passe.<br/>
                Voici votre mot de passe actuel ainsi qu'un lien pour le modifier.
              </p>

              {{-- Old password box --}}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:18px 22px;">
                    <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
                      Votre mot de passe actuel
                    </div>
                    <div style="font-size:20px;font-weight:700;color:#111;letter-spacing:2px;font-family:'Courier New',monospace;">
                      {{ $user->plain_password ?? '—' }}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.65;">
                Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
                Ce lien est valable pendant <strong>1 heure</strong>.
              </p>

              {{-- Button --}}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="{{ $resetUrl }}"
                       style="display:inline-block;background:#22c55e;color:#111111;font-size:14px;font-weight:700;
                              padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.<br/>
                Votre mot de passe ne sera pas modifié.
              </p>
            </td>
          </tr>

          {{-- Footer --}}
          <tr>
            <td style="background:#f4f4f5;border-radius:0 0 14px 14px;padding:20px 36px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                ISTA Hay Salam — CF SALE I &nbsp;·&nbsp; Abd Abdelkrim Khatabi, Hay Salam - Salé
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#d4d4d8;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
