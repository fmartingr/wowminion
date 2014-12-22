#!/usr/bin/env node

var wowminion = require('../');
var print = require('node-print');
var program = require('commander');

program.version('0.1.0');

// Info
program
    .command('info <site> <id> <none>')
    .action(function(site, id, args) {
        //console.log(site, id, args)/**/
        wowminion.SiteManager.use(site).getInfo(id, function(obj) {
            print.pf('Getting info for... %s'.yellow, id.white);
            print.pt([{
                'name': obj.name,
                'version': obj.version
            }]);
        });
    });

// List
program
    .command('list')
    .action(function(name) {
        wowminion.AddonManager.list(function(addons) {
            print.pt(addons)
        })
    });

// Search
program
    .command('search <term>')
    .action(function(term) {
        wowminion.SiteManager.use('curse').search(term, function(results) {
            print.pt(results);
            console.log("")
            console.log("To install an addon, use:")
            console.log("    install <addon id>")
        });
    })

// Main
program.parse(process.argv);
