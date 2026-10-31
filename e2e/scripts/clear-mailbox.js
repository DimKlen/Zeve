// Vide Mailpit avant une connexion : le lien magique lu ensuite est forcément le bon.
// Les scripts Maestro tournent sur la machine hôte : Mailpit y est sur 127.0.0.1.
var MAILPIT = 'http://127.0.0.1:55324';
http.request(MAILPIT + '/api/v1/messages', { method: 'DELETE' });
