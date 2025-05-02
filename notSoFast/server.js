const _0x56061b = _0x4a1f;

(function (_0x3d4f7d, _0x384467) {
    const _0x2bc30d = _0x4a1f,
        _0x2a57c0 = _0x3d4f7d();

    while ([]) {
        try {
            const _0x509389 =
                parseInt(_0x2bc30d(0xf9)) / 0x1 +
                (-parseInt(_0x2bc30d(0xf8)) / 0x2) *
                    (parseInt(_0x2bc30d(0xf3)) / 0x3) +
                parseInt(_0x2bc30d(0x100)) / 0x4 +
                -parseInt(_0x2bc30d(0xef)) / 0x5 +
                parseInt(_0x2bc30d(0xeb)) / 0x6 +
                parseInt(_0x2bc30d(0xee)) / 0x7 +
                (-parseInt(_0x2bc30d(0xe3)) / 0x8) *
                    (-parseInt(_0x2bc30d(0xf4)) / 0x9);

            if (_0x509389 === _0x384467) {
                break;
            } else {
                _0x2a57c0["push"](_0x2a57c0["shift"]());
            }
        } catch (_0x4f4837) {
            _0x2a57c0["push"](_0x2a57c0["shift"]());
        }
    }
})(_0x5ba1, 0x37cc5);
const express = require(_0x56061b(0xfa)),
    app = express(),
    path = require("path");
const articles_data = require(
        path[_0x56061b(0xfd)](__dirname, _0x56061b(0xf7)),
    ),
    rateLimiter = {
        max: 0x5,
        windowMs: 0x3e8,
        reset: Date[_0x56061b(0xe7)]() - 0x7d0,
        remaining: 0x5,
    };

function _0x4a1f(_0xa5c9f4, _0x34d88a) {
    const _0x5ba126 = _0x5ba1();

    return (
        (_0x4a1f = function (_0x4a1f4f, _0x57de0b) {
            _0x4a1f4f = _0x4a1f4f - 0xe1;
            const _0x91c04c = _0x5ba126[_0x4a1f4f];

            return _0x91c04c;
        }),
        _0x4a1f(_0xa5c9f4, _0x34d88a)
    );
}
function _0x5ba1() {
    const _0x15e55c = [
        "remaining",
        "/articles",
        "X-RateLimit-Reset",
        "now",
        "X-RateLimit-Remaining",
        "\x20has\x20been\x20found",
        "end",
        "1185066KdUuVR",
        "listen",
        "send",
        "1849449xJgCmq",
        "1269280gTNiiN",
        "get",
        "reset",
        "/articles/:id([0-9]+)",
        "111uXMghV",
        "72891SGOhSD",
        "Too\x20many\x20requests",
        "Server\x20running\x20at\x20http://localhost:",
        "./articles.json",
        "11996YaeIzr",
        "64830rqNiDl",
        "express",
        "status",
        "find",
        "resolve",
        "No\x20article\x20with\x20id\x20",
        "max",
        "678736fMeEWy",
        "X-RateLimit-Limit",
        "params",
        "log",
        "set",
        "8YaqgyJ",
    ];

    _0x5ba1 = function () {
        return _0x15e55c;
    };
    return _0x5ba1();
}
app[_0x56061b(0xf0)](_0x56061b(0xe5), (_0x53adb0, _0x2f6c36) => {
    const _0x2e7227 = _0x56061b;

    _0x2f6c36[_0x2e7227(0xfb)](0xc8)[_0x2e7227(0xed)]({
        message: articles_data["length"],
    });
}),
    app["get"](_0x56061b(0xf2), (_0x58952c, _0x1c1b41) => {
        const _0x1800af = _0x56061b;

        rateLimiter[_0x1800af(0xf1)] < Date[_0x1800af(0xe7)]() &&
            ((rateLimiter["remaining"] = rateLimiter["max"]),
            (rateLimiter["reset"] = Date["now"]() + rateLimiter["windowMs"]));
        if (rateLimiter[_0x1800af(0xe4)] == 0x0) {
            _0x1c1b41[_0x1800af(0xfb)](0x1ad)["send"](_0x1800af(0xf5));
            return;
        } else {
            rateLimiter[_0x1800af(0xe4)]--;
        }

        const _0xca1069 = rateLimiter[_0x1800af(0xff)],
            _0x5c15a1 = rateLimiter[_0x1800af(0xe4)],
            _0x5d6b61 = parseFloat(rateLimiter[_0x1800af(0xf1)] / 0x3e8);

        _0x1c1b41[_0x1800af(0xe2)](_0x1800af(0x101), _0xca1069),
            _0x1c1b41[_0x1800af(0xe2)](_0x1800af(0xe8), _0x5c15a1),
            _0x1c1b41[_0x1800af(0xe2)](_0x1800af(0xe6), _0x5d6b61);
        const _0x413373 = articles_data[_0x1800af(0xfc)](
            (_0x4868bf) =>
                _0x4868bf["id"] === parseInt(_0x58952c[_0x1800af(0x102)]["id"]),
        );

        if (_0x413373) {
            _0x1c1b41["status"](0xc8)["send"](_0x413373);
            return;
        } else {
            _0x1c1b41["writeHead"](
                0x194,
                _0x1800af(0xfe) +
                    _0x58952c[_0x1800af(0x102)]["id"] +
                    _0x1800af(0xe9),
            );
        }

        _0x1c1b41[_0x1800af(0xea)]();
    });
const server = app[_0x56061b(0xec)](0xbb8, () => {});

console[_0x56061b(0xe1)](_0x56061b(0xf6) + 0xbb8 + "/");
