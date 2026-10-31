// Récupère le lien magique envoyé à EMAIL dans Mailpit et en déduit le lien profond de l'app.
// Le lien Supabase (/auth/v1/verify) redirige vers zeve://auth/callback?code=… ; on suit cette
// redirection ici, côté hôte, puis Maestro ouvre directement le lien profond dans l'app
// (Chrome sur émulateur n'ouvre pas toujours un schéma personnalisé sans geste de l'utilisateur).
var MAILPIT = 'http://127.0.0.1:55324';

var search = http.get(MAILPIT + '/api/v1/search?query=' + encodeURIComponent('to:' + EMAIL));
var messages = json(search.body).messages;
if (!messages || messages.length === 0) {
  throw new Error('Aucun e-mail reçu pour ' + EMAIL + ' (le flow réessaie).');
}
var message = json(http.get(MAILPIT + '/api/v1/message/' + messages[0].ID).body);
var href = message.HTML.match(/href="([^"]+)"/);
if (!href) throw new Error('Pas de lien dans l’e-mail.');
var verifyUrl = href[1].replace(/&amp;/g, '&');

var response = http.get(verifyUrl);
var headers = response.headers || {};
var location = headers.location || headers.Location;
// Lien profond si la redirection est lisible ; sinon le lien web (l'émulateur joint l'hôte via 10.0.2.2).
output.link = location && location.indexOf('zeve://') === 0
  ? location
  : verifyUrl.replace('127.0.0.1', '10.0.2.2');
