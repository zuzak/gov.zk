# zuzakistan
[![Build Status](https://travis-ci.org/zuzak/gov.zk.svg?branch=master)](https://travis-ci.org/zuzak/gov.zk)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/0e395a9265e8445596c02a552d6d3281)](https://www.codacy.com/app/douglas/gov-zk?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=zuzak/gov.zk&amp;utm_campaign=Badge_Grade)
[![Coverage Status](https://coveralls.io/repos/github/zuzak/gov.zk/badge.svg?branch=master)](https://coveralls.io/github/zuzak/gov.zk?branch=master)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

## Installation
```
$ npm install
```
## Deployment
For the full effect:
```
$ echo 'gov.zk 127.0.0.1' | sudo tee /etc/hosts
$ sudo iptables -t nat -A OUTPUT -o lo -p tcp --dport 80 -j REDIRECT --to-port 8080
```

## Contributing
This repository uses [standard](http://standardjs.com/) as its coding style.

Install this module by cloning it and running `npm install`.
In addition to the usual things needed for the program to work, this will
also install a Git pre-commit hook that runs the linter before each commit
automatically. In the unlikely event that you need to overrule this, use
`git commit -n`.

A contributor might find the following useful:
* [GOV.UK elements](https://govuk-elements.herokuapp.com/)
* [GOV.UK frontend toolkit](https://github.com/alphagov/govuk_frontend_toolkit)

### Coverage
To check the coverage of the tests, invoke `npm run coverage`.
The report will open in your default browser.

We're not using the GOV.UK template directly.
