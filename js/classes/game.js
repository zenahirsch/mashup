define(function () {

    var Game = function () {};

    Game.prototype.userId = null;

    Game.prototype.chosenPlaylist = null;

    Game.prototype.accessToken = null;

    Game.prototype.playlistTracks = null;

    Game.prototype.getAccessToken = function () {
        var hash = window.location.hash.substring(1),
            pairs = hash.split('&'),
            firstPair = pairs[0].split('=');

        if (firstPair[0] === 'access_token') {
            this.accessToken = firstPair[1];
            return true;
        } else {
            console.log('Could not get the access token.');
            return false;
        }
    };

    Game.prototype.getData = function (callback) {
        var that = this;

        this.getUserId(function () {
            that.showUserId().choosePlaylist(function () {
                that.showPlaylistInfo().getPlaylistTracks(function () {
                    that.showTracks();
                });
            });
        });
    };

    Game.prototype.showUserId = function () {
        var $userId = $('#user-id'),
            userId = this.userId;

        $userId.html(userId);

        return this;
    };

    Game.prototype.showPlaylistInfo = function () {
        var $playlistName = $('#playlist-name'),
            playlistName = this.chosenPlaylist.name;

        $playlistName.html(playlistName);

        return this;
    };

    Game.prototype.showTracks = function () {
        var $trackList = $('#track-list'),
            tracks = this.playlistTracks.items,
            popularity,
            li,
            i;

        for (i = 0; i < tracks.length; i++) {
            popularity = tracks[i].track.popularity;
            li = '<li>' + tracks[i].track.name + ' (popularity: ' + popularity + ')</li>'
            $trackList.append(li);
        }

        return this;
    };

    Game.prototype.getUserId = function (callback) {
        var that = this;

        $.ajax({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': 'Bearer ' + this.accessToken
            },
            success: function (result) {
                var userId = result.id;
                that.userId = userId;
                callback();
            },
            error: function (err) {
                console.log(err);
            }
        });
    };

    Game.prototype.choosePlaylist = function (callback) {
        var that = this;

        $.ajax({
            url: 'https://api.spotify.com/v1/users/' + that.userId + '/playlists',
            headers: {
                'Authorization': 'Bearer ' + this.accessToken
            },
            success: function (playlistData) {
                var playlists = playlistData.items,
                    chosenPlaylist,
                    r;

                while (!chosenPlaylist) {
                    if (playlists.length) {
                        r = Math.floor(Math.random() * playlists.length);

                        if (playlists[r].tracks.total > 1) {
                            chosenPlaylist = playlists[r];
                            that.chosenPlaylist = chosenPlaylist;
                            callback();
                        }
                    }
                }
                
            },
            error: function (err) {
                console.log(err);
            }
        });
    };

    Game.prototype.getPlaylistTracks = function (callback) {
        var playlistId = this.chosenPlaylist.id,
            playlistOwnerId = this.chosenPlaylist.owner.id,
            that = this;

        $.ajax({
            url: 'https://api.spotify.com/v1/users/' + playlistOwnerId + '/playlists/' + playlistId + '/tracks',
            headers: {
                'Authorization': 'Bearer ' + this.accessToken
            },
            success: function (tracks) {
                that.playlistTracks = tracks;
                callback();
                
            },
            error: function (err) {
                console.log(err);
            }
        });
    };

    return Game;
});