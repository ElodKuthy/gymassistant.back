(function () {
    "use strict";

    exports.invalidUserNameOrPassword = invalidUserNameOrPassword;
    exports.unauthorized = unauthorized;
    exports.invalidTrainingId = invalidTrainingId;
    exports.trainingEnded = trainingEnded;
    exports.trainingFull = trainingFull;
    exports.unknownUserName = unknownUserName;
    exports.alreadySignedUp = alreadySignedUp;
    exports.selfAttend = selfAttend;
    exports.noCredit = noCredit;
    exports.notSignedUp = notSignedUp;
    exports.alreadyCheckedIn = alreadyCheckedIn;
    exports.notCheckedIn = notCheckedIn;
    exports.toLateToLeave = toLateToLeave;
    exports.onlyPositiveIntegers = onlyPositiveIntegers;
    exports.passwordChangeFailed = passwordChangeFailed;

    var logger = require("./log.js");

    var errorMessages = {
        invalidUserNameOrPassword: "Hibás felhasználónév vagy jelszó",
        unauthorized: "Ehhez a művelethez nincs jogosultsága",
        invalidTrainingId: "Hibás edzés azonosító",
        trainingEnded: "Ez az óra már véget ért",
        trainingFull: "Ez az edzés már megtelt",
        unknownUserName: "Nincs ilyen nevű felhasználó",
        alreadySignedUp: "A felhasználó már feliratkozott",
        selfAttend: "Saját órára nem lehet feliratkozni",
        noCredit: "A felhasználónak nincs több szabad kreditje",
        notSignedUp: "A felhasználó nem iratkozott fel erre az órára",
        alreadyCheckedIn: "A felhasználó már bejelentkezett erre az órára",
        notCheckedIn: "A felhasználó nem jelentkezett be erre az órára",
        toLateToLeave: "Erről az óráról már túl késő leiratkozni",
        onlyPositiveIntegers: "A kreditekhez csak pozitív egész szám adható",
        passwordChangeFailed: "Nem sikerült megváltoztatni a jelszót"
    };

    function Error(message) {
        this.error = {};
        this.error.message = message;
    }

    function invalidUserNameOrPassword() {
        logger.error(errorMessages.invalidUserNameOrPassword);
        return new Error(errorMessages.invalidUserNameOrPassword);
    }

    function unauthorized() {
        logger.error(errorMessages.unauthorized);
        return new Error(errorMessages.unauthorized);
    }

    function invalidTrainingId() {
        logger.error(errorMessages.invalidTrainingId);
        return new Error(errorMessages.invalidTrainingId);
    }

    function trainingEnded() {
        logger.error(errorMessages.trainingEnded);
        return new Error(errorMessages.trainingEnded);
    }

    function trainingFull() {
        logger.error(errorMessages.trainingFull);
        return new Error(errorMessages.trainingFull);
    }

    function unknownUserName() {
        logger.error(errorMessages.unknownUserName);
        return new Error(errorMessages.unknownUserName);
    }

    function alreadySignedUp() {
        logger.error(errorMessages.alreadySignedUp);
        return new Error(errorMessages.alreadySignedUp);
    }

    function selfAttend() {
        logger.error(errorMessages.selfAttend);
        return new Error(errorMessages.selfAttend);
    }

    function noCredit() {
        logger.error(errorMessages.noCredit);
        return new Error(errorMessages.noCredit);
    }

    function notSignedUp() {
        logger.error(errorMessages.notSignedUp);
        return new Error(errorMessages.notSignedUp);
    }

    function alreadyCheckedIn() {
        logger.error(errorMessages.alreadyCheckedIn);
        return new Error(errorMessages.alreadyCheckedIn);
    }

    function notCheckedIn() {
        logger.error(errorMessages.notCheckedIn);
        return new Error(errorMessages.notCheckedIn);
    }

    function toLateToLeave() {
        logger.error(errorMessages.toLateToLeave);
        return new Error(errorMessages.toLateToLeave);
    }

    function onlyPositiveIntegers() {
        logger.error(errorMessages.onlyPositiveIntegers);
        return new Error(errorMessages.onlyPositiveIntegers);
    }

    function passwordChangeFailed() {
        logger.error(errorMessages.passwordChangeFailed);
        return new Error(errorMessages.passwordChangeFailed);
    }

})();