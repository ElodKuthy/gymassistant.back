(function () {
    'use strict';

    module.exports = Errors;

    Errors.$inject = ['log'];

    function Errors(log) {
        var self = this;
        self.messages = {
            serverError: 'Szerver hiba',
            invalidUserNameOrPassword: 'Hibás felhasználónév vagy jelszó',
            unauthorized: 'Ehhez a művelethez nincs jogosultsága',
            invalidTrainingId: 'Hibás edzés azonosító',
            trainingEnded: 'Ezt az órát már nem lehet módosítani',
            trainingFull: 'Ez az edzés már megtelt',
            unknownUserName: 'Nincs ilyen nevű felhasználó',
            unknownUserEmail: 'Nincs ilyen email címmel regisztrált felhasználó',
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
            emailAlreadyExist: 'Ezzel az email címmel már regisztrált felhasználó',
            invalidPeriod: 'Ismeretlen periódus',
            notEnoughTrainingsForDailyTicket: 'Nincs ennyi napijeggyel elérhető óra ma',
            invalidCreditId: 'Ismeretlen kredit azonosító',
            dateIsInPast: 'Ez a dátum már elmúlt',
            invalidEmailFormat: 'Érvénytelen email cím formátum',
            trainingCanceled: 'Ez az óra már le lett mondva',
            missingProperty: 'Hiányzó mező: ',
            invalidToken: 'Érvénytelen token',
            expiredToken: 'Ez a token már lejárt',
            notFirstTime: 'A tanítványnak már nem ez az első alkalma',
            firstTimeModification: 'Az első ingyenes alkalmat nem lehet módosítani',
            seriesCancelled: 'Ez az edzés már törölve lett',
            invalidId: 'Érvénytelen azonosító'
        };

        self.invalidId = function () {
            log.error(self.messages.invalidId);
            return new Error(self.messages.invalidId);
        }

        self.seriesCancelled = function () {
            log.error(self.messages.seriesCancelled);
            return new Error(self.messages.seriesCancelled);
        }

        self.firstTimeModification = function () {
            log.error(self.messages.firstTimeModification);
            return new Error(self.messages.firstTimeModification);
        }

        self.notFirstTime = function () {
            log.error(self.messages.notFirstTime);
            return new Error(self.messages.notFirstTime);
        };

        self.invalidToken = function () {
            log.error(self.messages.invalidToken);
            return new Error(self.messages.invalidToken);
        };

        self.expiredToken = function () {
            log.error(self.messages.expiredToken);
            return new Error(self.messages.expiredToken);
        };

        self.missingProperty = function (obj, prop) {
            log.error(self.messages.missingProperty + obj + ' -> ' + prop);
            return new Error(self.messages.missingProperty + obj + ' -> ' + prop);
        }

        self.emailAlreadyExist = function () {
            log.error(self.messages.emailAlreadyExist);
            return new Error(self.messages.emailAlreadyExist);
        };

        self.serverError = function () {
            log.error(self.messages.serverError);
            return new Error(self.messages.serverError);
        };

        self.invalidUserNameOrPassword = function () {
            log.error(self.messages.invalidUserNameOrPassword);
            return new Error(self.messages.invalidUserNameOrPassword);
        };

        self.unauthorized = function () {
            log.error(self.messages.unauthorized);
            return new Error(self.messages.unauthorized);
        };

        self.invalidTrainingId = function () {
            log.error(self.messages.invalidTrainingId);
            return new Error(self.messages.invalidTrainingId);
        };

        self.trainingEnded = function () {
            log.error(self.messages.trainingEnded);
            return new Error(self.messages.trainingEnded);
        };

        self.trainingFull = function () {
            log.error(self.messages.trainingFull);
            return new Error(self.messages.trainingFull);
        };

        self.unknownUserName = function () {
            log.error(self.messages.unknownUserName);
            return new Error(self.messages.unknownUserName);
        };

        self.alreadySignedUp = function () {
            log.error(self.messages.alreadySignedUp);
            return new Error(self.messages.alreadySignedUp);
        };

        self.selfAttend = function () {
            log.error(self.messages.selfAttend);
            return new Error(self.messages.selfAttend);
        };

        self.noCredit = function () {
            log.error(self.messages.noCredit);
            return new Error(self.messages.noCredit);
        };

        self.notSignedUp = function () {
            log.error(self.messages.notSignedUp);
            return new Error(self.messages.notSignedUp);
        };

        self.alreadyCheckedIn = function () {
            log.error(self.messages.alreadyCheckedIn);
            return new Error(self.messages.alreadyCheckedIn);
        };

        self.notCheckedIn = function () {
            log.error(self.messages.notCheckedIn);
            return new Error(self.messages.notCheckedIn);
        };

        self.toLateToLeave = function () {
            log.error(self.messages.toLateToLeave);
            return new Error(self.messages.toLateToLeave);
        };

        self.onlyPositiveIntegers = function () {
            log.error(self.messages.onlyPositiveIntegers);
            return new Error(self.messages.onlyPositiveIntegers);
        };

        self.passwordChangeFailed = function () {
            log.error(self.messages.passwordChangeFailed);
            return new Error(self.messages.passwordChangeFailed);
        };

        self.cantModifyNotOwnTraining = function () {
            log.error(self.messages.cantModifyNotOwnTraining);
            return new Error(self.messages.cantModifyNotOwnTraining);
        };

        self.tooEarlyToCheckIn = function () {
            log.error(self.messages.tooEarlyToCheckIn);
            return new Error(self.messages.tooEarlyToCheckIn);
        };

        self.userNameAlreadyExist = function () {
            log.error(self.messages.userNameAlreadyExist);
            return new Error(self.messages.userNameAlreadyExist);
        };

        self.invalidPeriod = function () {
            log.error(self.messages.invalidPeriod);
            return new Error(self.messages.invalidPeriod);
        };

        self.notEnoughTrainingsForDailyTicket = function () {
            log.error(self.messages.notEnoughTrainingsForDailyTicket);
            return new Error(self.messages.notEnoughTrainingsForDailyTicket);
        };

        self.invalidCreditId = function () {
            log.error(self.messages.invalidCreditId);
            return new Error(self.messages.invalidCreditId);
        };

        self.dateIsInPast = function () {
            log.error(self.messages.dateIsInPast);
            return new Error(self.messages.dateIsInPast);
        };

        self.invalidEmailFormat = function () {
            log.error(self.messages.invalidEmailFormat);
            return new Error(self.messages.invalidEmailFormat);
        };

        self.trainingCanceled = function () {
            log.error(self.messages.trainingCanceled);
            return new Error(self.messages.trainingCanceled);
        };

        self.unknownUserEmail = function () {
            log.error(self.messages.unknownUserEmail);
            return new Error(self.messages.unknownUserEmail);
        };
    }
})();