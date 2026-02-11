"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EDUCATION_LEVEL_OPTIONS = exports.EDUCATION_LEVEL_LABELS = exports.EDUCATION_LEVEL = void 0;
exports.EDUCATION_LEVEL = {
    ILKOGRETIM: 'ilkogretim',
    LISE: 'lise',
    ON_LISANS: 'on_lisans',
    LISANS: 'lisans',
    YUKSEK_LISANS: 'yuksek_lisans',
    DOKTORA: 'doktora',
};
exports.EDUCATION_LEVEL_LABELS = {
    ilkogretim: 'İlköğretim',
    lise: 'Lise',
    on_lisans: 'Ön Lisans',
    lisans: 'Lisans',
    yuksek_lisans: 'Yüksek Lisans',
    doktora: 'Doktora',
};
exports.EDUCATION_LEVEL_OPTIONS = Object.entries(exports.EDUCATION_LEVEL_LABELS).map(
    function (_a) { var value = _a[0], label = _a[1]; return ({ value: value, label: label }); }
);