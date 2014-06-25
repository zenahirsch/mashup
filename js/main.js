define(function (require) {

    var Game = require('classes/game'),
        g = new Game(),
        $loginLink = $('#login-link');

    if (g.getAccessToken()) {
        g.getData();
    }

});