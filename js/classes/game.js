define(function () {

    var Game = function () {
        this.playlistTracks = [];
    };

    Game.prototype.userId = null;

    Game.prototype.chosenPlaylist = null;

    Game.prototype.accessToken = null;

    Game.prototype.playlistTracks = null;

    Game.prototype.displayGame = function () {
        $('#game').show();
        $('#header').show();
        $('#login-message').hide();
        return this;
    };

    Game.prototype.getAccessToken = function () {
        var hash = window.location.hash.substring(1),
            pairs = hash.split('&'),
            firstPair = pairs[0].split('=');

        if (firstPair[0] === 'access_token') {
            this.accessToken = firstPair[1];
            this.displayGame();
            return true;
        } else {
            console.log('Could not get the access token.');
            this.displayLoginMessage();
            return false;
        }
    };

    Game.prototype.displayLoginMessage = function () {
        var $loginMessage = $('#login-message');

        $loginMessage.show();
    };

    Game.prototype.getData = function () {
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
        var $playlistName = $('#playlist-name');

        if (this.chosenPlaylist) {
            $playlistName.html(this.chosenPlaylist.name);
        } else {
            $playlistName.html('None');
        }

        return this;
    };

    Game.prototype.showTracks = function () {
        var $trackList = $('#waffle'),
            popularity,
            previewURL,
            tracks,
            li,
            i;

        $('#loading-message').hide();
        $trackList.empty();

        if (this.playlistTracks && this.playlistTracks.items) {
            tracks = this.playlistTracks.items;
            for (i = 0; i < tracks.length; i++) {
                console.log(tracks[i].track);
                popularity = tracks[i].track.popularity;
                previewURL = tracks[i].track.preview_url;
                li = '' +
                    '<li id="track-' + i + '" data-popularity="' + popularity + '">' +
                        '<span class="track-name">' + tracks[i].track.name + '</span> ' +
                        '<span class="artist">' + tracks[i].track.artists[0].name + '</span> ' +
                        '<span class="preview">' +
                            '<a href="/" class="preview-link" data-preview-url="' + previewURL + '">&#9835;</a>' +
                        '</span>'
                    '</li>';
                $trackList.append(li);
                tracks[i].li = $('#track-' + i);
            }
        } else {
            $trackList.html(
                '<div class="lb-message">' +
                    '<div class="lb-message-content">' +
                        '<p>No playist found.</p>' +
                        '<p class="lb-subtext">Create a Spotify playlist with more than one track in it!</p>' +
                        '<a href="/" id="try-again-link" class="lb-link">Try again</a>' +
                    '</div>' +
                '</div>'
            );
        }

        $('.reminder').show();

        this.applyListeners();

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
                    possiblePlaylists = [],
                    chosenPlaylist,
                    r,
                    i;

                for (i = 0; i < playlists.length; i++) {
                    if (playlists[i].tracks.total > 1) {
                        possiblePlaylists.push(playlists[i]);
                    }
                }

                if (possiblePlaylists.length) {
                    r = Math.floor(Math.random() * possiblePlaylists.length);
                    that.chosenPlaylist = possiblePlaylists[r];
                    callback();
                } else {
                    that.chosenPlaylist = null;
                    callback();
                }
            },
            error: function (err) {
                console.log(err);
            }
        });
    };

    Game.prototype.getPlaylistTracks = function (callback) {
        var that = this;

        if (this.chosenPlaylist) {
            $.ajax({
                url: 'https://api.spotify.com/v1/users/' + that.chosenPlaylist.owner.id + '/playlists/' + that.chosenPlaylist.id + '/tracks',
                headers: {
                    'Authorization': 'Bearer ' + that.accessToken
                },
                success: function (tracks) {
                    that.playlistTracks = tracks;
                    callback();
                    
                },
                error: function (err) {
                    console.log(err);
                }
            });
        } else {
            callback();
        }
    };

    Game.prototype.applyListeners = function () {
        var that = this;

        $(document).waffler();

        $('#submit').click(function (e) {
            e.preventDefault();
            that.checkAnswer();
        });

        $('#reset').click(function (e) {
            e.preventDefault();
            that.reset();
        });

        $('.preview').click(function (e) {
            var $previewLink = $(this).find('.preview-link'),
                previewURL = $previewLink.data('preview-url'),
                $previewPlayer = $('#preview-player');

            e.preventDefault();

            if ($previewPlayer.attr('src') === previewURL) {
                $previewPlayer.trigger('pause').attr('src', '');
            } else {
                $previewPlayer.attr('src', previewURL).trigger('play');
            }
        });

        $('#play-again-link').click(function (e) {
            e.preventDefault();
            that.choosePlaylist(function () {
                that.showPlaylistInfo().getPlaylistTracks(function () {
                    that.showTracks();
                    $('#win-message').hide();
                });
            });
        });

        $('#try-again-link').click(function (e) {
            e.preventDefault();
            that.choosePlaylist(function () {
                that.showPlaylistInfo().getPlaylistTracks(function () {
                    that.showTracks();
                });
            });

        });

        return this;
    };

    Game.prototype.checkAnswer = function () {
        var $items = $('#waffle li'),
            finished = true,
            $item,
            $nextItem,
            id,
            thisPop,
            nextPop,
            i;

        $items.removeClass('wrong');

        for (i = 0; i < $items.length; i++) {
            $item = $($items[i]);
            $nextItem = $($items[i + 1]);
            thisPop = $item.data('popularity');
            nextPop = $nextItem.data('popularity');

            !nextPop ? nextPop = 0 : nextPop = nextPop;

            if (thisPop >= nextPop) {
                continue;
            } else {
                finished = false;
                $item.addClass('wrong');
            }
        }

        if (finished) {
            $('#win-message').show();
        }
    };

    Game.prototype.reset = function () {
        this.showTracks();
    };

    return Game;
});