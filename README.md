Site link: https://a4-austinhyatt.onrender.com/

Notes:
- logging in with username and password only works locally. if you try to use it on the site after logging into github it will just default to logging in with the registerd github account. This has something to do with how passport's local stragegy and github authentication interact, but I don't' think continuing to support traditonal username and password was even part of the requirements so this shouldn't be a problem.
- Don't leave the site running on dashboard for too long (like past 5-10 minutes), otherwise it will spin down and forget who the user is, causing the server to crash on the next request. Always login through the login page so it can gather a user.
