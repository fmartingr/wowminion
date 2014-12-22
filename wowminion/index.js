var cheerio = require('cheerio');
var cloudscraper = require('./cloudscrapper.js');
var print = require('node-print');
var fs = require('fs');
var path = require('path');
var appdirs = require('appdirs');
var request = require('request');
var FileCookieStore = require('tough-cookie-filestore');
var j = request.jar(new FileCookieStore('cookies.json'));
request = request.defaults({ jar: j })


var userDataDir = appdirs.userDataDir('wowminion');
console.log(userDataDir);

var Addon = (function(addon) {
    var addonObj = {
        id: addon.id,
        site: addon.site,
        name: addon.name,
        version: addon.version
    }
});

var AddonManager = (function() {
    var addons = [];
    var paths = {
        'wow': '/Applications/World of Warcraft/',
        'addons': '/Applications/World of Warcraft/Interface/Addons/'
    }

    var addonsExcludePatterns = ['Blizzard_', '.'];

    var install = function(foo) {
        // TODO
    };

    var remove = function(foo) {
        // TODO
    };

    var scan = function(foo) {
        var folders = fs.readdirSync(this.paths.addons);
        var filteredFolders = [];

        // Filter folders (we dont want hidden files or Blizzard addons)
        folders.forEach(function(folderName, index) {
            var excludeThis = false;
            addonsExcludePatterns.forEach(function(pattern) {
                if (folderName.indexOf(pattern) !== -1) {
                    excludeThis = true;
                }
            })

            if (!excludeThis) filteredFolders.push(folderName);
        })

        return filteredFolders;
    };

    var list = function(callback) {
        var addons = [];

        this.scan().forEach(function(addonName) {
            addons.push({
                folder: addonName,
                version: '??',
                'up to date': '??'
            })
        })

        callback(addons);
    }

    var update = function(foo) {
        // TODO
    };

    var getInfo = function(foo) {
        // TODO
    };

    var match = function(foo) {
        // TODO
    };

    return {
        addons: addons,
        paths: paths,
        install: install,
        remove: remove,
        scan: scan,
        list: list,
        update: update,
        getInfo: getInfo,
        match: match
    }
})();

var Curse = (function($){
    var baseUrl = 'http://www.curse.com/addons/wow/'
    var addons = {};

    return {
        id: 'curse',
        baseUrl: baseUrl,
        addons: addons,
        search: function(term, callback) {
            var url = 'http://www.curse.com/search?type=addons&search=' + term;
            $.getUrl(url, function(html, errors) {
                if (!errors) {
                    results = []
                    var $ = cheerio.load(html);

                    var rows = $('.listing.listing-project tr.wow');
                    rows.each(function(index, item) {
                        var name = $(item).find('td dl dt a').text(),
                            downloads = $(item).find('td dl dt').last().text(),
                            id = $(item).find('td dl dt a').attr('href').split('/').pop()
                        obj = {
                            id: id,
                            name: name,
                            downloads: downloads
                        }
                        results.push(obj);
                    });


                    callback(results);
                } else {
                    // TODO errors
                }
            });
        },
        getInfo: function(addonId, callback) {
            var url = this.baseUrl + addonId;
            $.getUrl(url, function(html, errors) {
                if (!errors) {
                    var $ = cheerio.load(html);

                    name = $('.breadcrumbs.group li:last-child').text().trim();
                    version = $('.newest-file').text().split(': ')[1].trim();

                    obj = {
                        url: url,
                        downloadUrl: url + '/download',
                        name: name,
                        version: version
                    };

                    addons[addonId] = obj;

                    callback(obj);
                } else {
                    // TODO errors
                }
            });
        },
        download: function(addonId, callback) {
            var url = this.baseUrl + addonId + '/download';
            var site = this;
            $.getUrl(url, function(html, errors) {
                if (!errors) {
                    var $ = cheerio.load(html);

                    var version = $('#breadcrumbs-wrapper > ul > li:nth-child(5) > span').text().trim();
                    var name = $('#file-download > div > div.caption-container.h2.no-sub.no-nav > h2 > span > span > span').text().trim();
                    var downloadUrl = $('.download-link').data('href');

                    var fileName = site.id + '_' + addonId + '_' + version + '.zip';

                    request(downloadUrl).pipe(
                        fs.createWriteStream(path.join(userDataDir, 'files', fileName))
                    );

                    obj = {
                        name: name,
                        version: version,
                        downloadUrl: downloadUrl,
                        localPath: path.join(userDataDir, 'addons', fileName)
                    };

                    addons[addonId] = obj;

                    callback(obj);
                } else {
                    // TODO errors
                }
            });
        }
    }
});

var SiteManager = (function(){
    var sites = {
        'curse': Curse
    }
    return {
        sites: sites,
        use: function(siteId) {
            return this.sites[siteId](this);
        },
        getUrl: function(url, callback) {
            cloudscraper.get(url, function(error, html, response) {
                if (!error) {
                    return callback(html, false);
                } else {
                    return callback(error, true);
                }
            });
        }
    }
})();
/*
SiteManager.use('curse').getInfo('breeze', function(obj) {
    print.pf('Getting info for... %s'.yellow, 'breeze'.white);
    console.log(obj);
})
*/


// AddonManager.scan()

module.exports = {
    SiteManager: SiteManager,
    AddonManager: AddonManager
}

