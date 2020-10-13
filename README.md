# EmmServer
Reverse Engineered third party API server for EMMVRC

## Warning!
This code is VERY messy and was threw together in the space of 4-6 hours over midnight.

Feel free to use this but no bug testing or security audits have been run.

## Features

- [x] Authentication
- [x] Messages
- [x] Avatar Favs
- [x] Avatar Search
- [ ] Pin Login

## Authentication
From looking at the tokens the real EMMVRC API gives I believe they are using JWT. I couldn't be bothered... so you get a random 32 hex token that gets revoked at the end of session.

Also without a pin someone could impersonate you as its litterally just userID used to give a token, both here and on the real api, only the real API has a pin for now.
