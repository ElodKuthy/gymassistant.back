(function () {
    'use strict';

    module.exports = Errors;

    Errors.$inject = ['log'];
    function Errors(log) {
        var self = this;
        var errorMessages = {
            serverError: 'Szerver hiba',
            invalidUserNameOrPassword: 'Hibás felhasználónév vagy jelszó',
            unauthorized: 'Ehhez a művelethez nincs jogosultsága',
            invalidTrainingId: 'Hibás edzés azonosító',
            trainingEnded: 'Ez az óra már véget ért',
            trainingFull: 'Ez az edzés már megtelt',
            unknownUserName: 'Nincs ilyen nevű felhasználó',
            alreadySignedUp: 'A felhasználó már feliratkozott',
            selfAttend: 'Saját órára nem lehet feliratkozni',
            noCredit: 'A felhasználónak nincs több szabad kreditje',
            notSignedUp: 'A felhasználó nem iratkozott fel erre az órára',
            alreadyCheckedIn: 'A felhasználó már bejelentkezett erre az órára',
            notCheckedIn: 'A felhasználó nem jelentkezett be erre az órára',
            toLateToLeave: 'Erről az óráról már túl késő leiratkozni',
            onlyPositiveIntegers: 'A kreditekhez csak pozitív egész szám adható',
            passwordChangeFailed: 'Nem sikerült megváltoztatni a jelszót',
            cantModifyNotOwnTraining: 'Csak a saját óráit módosíthatja az edző',
            tooEarlyToCheckIn: 'Erre az órára még korai bejelentkezni',
            userNameAlreadyExist: 'Már van ilyen nevű felhasználó',
            invalidPeriod: 'Ismeretlen periódus',
            notEnoughTrainingsForDailyTicket: 'Nincs ennyi napijeggyel elérhető óra ma',
            invalidCreditId: 'Ismeretlen kredit azonosító'
        };

        function Error(message) {
            this.error = {};
            this.error.message = message;
        }

        self.serverError = function () {
            log.error(errorMessages.serverError);
            return new Error(errorMessages.serverError);
        };

        self.invalidUserNameOrPassword = function() {
            log.error(errorMessages.invalidUserNameOrPassword);
            return new Error(errorMessages.invalidUserNameOrPassword);
        };

        self.unauthorized = function() {
            log.error(errorMessages.unauthorized);
            return new Error(errorMessages.unauthorized);
         };

        self.invalidTrainingId = function() {
            log.error(errorMessages.invalidTrainingId);
            return new Error(errorMessages.invalidTrainingId);
        };

        self.trainingEnded = function() {
            log.error(errorMessages.trainingEnded);
            return new Error(errorMessages.trainingEnded);
        };

        self.trainingFull = function() {
            log.error(errorMessages.trainingFull);
            return new Error(errorMessages.trainingFull);
        };

        self.unknownUserName = function() {
            log.error(errorMessages.unknownUserName);
            return new Error(errorMessages.unknownUserName);
        };

        self.alreadySignedUp = function() {
            log.error(errorMessages.alreadySignedUp);
            return new Error(errorMessages.alreadySignedUp);
        };

        self.selfAttend = function() {
            log.error(errorMessages.selfAttend);
            return new Error(errorMessages.selfAttend);
        };

        self.noCredit = function() {
            log.error(errorMessages.noCredit);
            return new Error(errorMessages.noCredit);
        };

        self.notSignedUp = function() {
            log.error(errorMessages.notSignedUp);
            return new Error(errorMessages.notSignedUp);
        };

        self.alreadyCheckedIn = function() {
            log.error(errorMessages.alreadyCheckedIn);
            return new Error(errorMessages.alreadyCheckedIn);
        };

        self.notCheckedIn = function() {
            log.error(errorMessages.notCheckedIn);
            return new Error(errorMessages.notCheckedIn);
        };

        self.toLateToLeave = function() {
            log.error(errorMessages.toLateToLeave);
            return new Error(errorMessages.toLateToLeave);
        };

        self.onlyPositiveIntegers = function() {
            log.error(errorMessages.onlyPositiveIntegers);
            return new Error(errorMessages.onlyPositiveIntegers);
        };

        self.passwordChangeFailed = function() {
            log.error(errorMessages.passwordChangeFailed);
            return new Error(errorMessages.passwordChangeFailed);
        };

        self.cantModifyNotOwnTraining = function() {
            log.error(errorMessages.cantModifyNotOwnTraining);
            return new Error(errorMessages.cantModifyNotOwnTraining);
        };

        self.tooEarlyToCheckIn = function() {
            log.error(errorMessages.tooEarlyToCheckIn);
            return new Error(errorMessages.tooEarlyToCheckIn);
        };

        self.userNameAlreadyExist = function() {
            log.error(errorMessages.userNameAlreadyExist);
            return new Error(errorMessages.userNameAlreadyExist);
        };

        self.invalidPeriod = function() {
            log.error(errorMessages.invalidPeriod);
            return new Error(errorMessages.invalidPeriod);
        };

        self.notEnoughTrainingsForDailyTicket = function() {
            log.error(errorMessages.notEnoughTrainingsForDailyTicket);
            return new Error(errorMessages.notEnoughTrainingsForDailyTicket);
        };

        self.invalidCreditId = function() {
            log.error(errorMessages.invalidCreditId);
            return new Error(errorMessages.invalidCreditId);
        };
    }
})();