#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const appJsonPath = path.join(__dirname, "..", "app.json");
const appRoot = path.join(__dirname, "..");

function fail(message) {
    console.error(message);
    process.exit(1);
}

function parseOptions(argv) {
    const options = {
        platform: "all",
        autoSubmit: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--platform") {
            const value = argv[index + 1];

            if (!value || !["all", "ios", "android"].includes(value)) {
                fail("Expected --platform to be one of: all, ios, android.");
            }

            options.platform = value;
            index += 1;
            continue;
        }

        if (arg === "--auto-submit") {
            options.autoSubmit = true;
            continue;
        }

        fail(`Unknown argument: ${arg}`);
    }

    return options;
}

function readAppConfig() {
    try {
        return JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    } catch (error) {
        fail(`Failed to read ${appJsonPath}: ${error.message}`);
    }
}

function parseBuildNumber(value, fieldName) {
    const parsed = Number.parseInt(String(value), 10);

    if (!Number.isInteger(parsed) || parsed < 0) {
        fail(`${fieldName} must be a non-negative integer. Received: ${value}`);
    }

    return parsed;
}

function incrementAppVersion(value) {
    const match = String(value).match(/^(\d+)\.(\d+)\.(\d+)$/);

    if (!match) {
        fail(`expo.version must use MAJOR.MINOR.PATCH format. Received: ${value}`);
    }

    const [, major, minor, patch] = match;

    return `${major}.${minor}.${Number.parseInt(patch, 10) + 1}`;
}

function updateBuildNumbers(config) {
    const expoConfig = config.expo;

    if (!expoConfig?.ios || !expoConfig?.android) {
        fail("app.json must define both expo.ios and expo.android.");
    }

    const currentIosBuild = parseBuildNumber(expoConfig.ios.buildNumber, "expo.ios.buildNumber");
    const currentAndroidBuild = parseBuildNumber(
        expoConfig.android.versionCode,
        "expo.android.versionCode",
    );
    const currentAppVersion = expoConfig.version;
    const nextBuild = Math.max(currentIosBuild, currentAndroidBuild) + 1;
    const nextAppVersion = incrementAppVersion(currentAppVersion);

    expoConfig.version = nextAppVersion;
    expoConfig.ios.buildNumber = String(nextBuild);
    expoConfig.android.versionCode = nextBuild;

    fs.writeFileSync(appJsonPath, `${JSON.stringify(config, null, 2)}\n`);

    console.log(
        `Updated app version ${currentAppVersion} -> ${nextAppVersion}; iOS ${currentIosBuild} -> ${nextBuild}; Android ${currentAndroidBuild} -> ${nextBuild}`,
    );
}

function runProductionBuild(options) {
    const command = ["exec", "eas", "build", "--platform", options.platform, "--profile", "production"];

    if (options.autoSubmit) {
        command.push("--auto-submit");
    }

    const result = spawnSync("pnpm", command, {
        cwd: appRoot,
        stdio: "inherit",
    });

    if (result.error) {
        fail(`Failed to start EAS build: ${result.error.message}`);
    }

    process.exit(result.status ?? 1);
}

const options = parseOptions(process.argv.slice(2));
const appConfig = readAppConfig();
updateBuildNumbers(appConfig);
runProductionBuild(options);
