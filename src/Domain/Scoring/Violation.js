/**
 * Violation - Value Object representing a style constraint violation.
 * Immutable.
 */
export class Violation {
    /**
     * @param {string} constraintId - ID of the violated constraint
     * @param {string} featureName - Name of the feature that violated the constraint
     * @param {number} expectedValue - The threshold value expected
     * @param {number} actualValue - The actual value calculated
     * @param {number} severity - Severity of the violation (0.0 to 1.0)
     */
    constructor(constraintId, featureName, expectedValue, actualValue, severity) {
        if (!constraintId || typeof constraintId !== 'string') {
            throw new Error('Constraint ID must be a non-empty string');
        }
        if (!featureName || typeof featureName !== 'string') {
            throw new Error('Feature name must be a non-empty string');
        }
        if (typeof expectedValue !== 'number' || isNaN(expectedValue)) {
            throw new Error('Expected value must be a number');
        }
        if (typeof actualValue !== 'number' || isNaN(actualValue)) {
            throw new Error('Actual value must be a number');
        }
        if (typeof severity !== 'number' || severity < 0 || severity > 1) {
            throw new Error('Severity must be a number between 0 and 1');
        }

        this._constraintId = constraintId;
        this._featureName = featureName;
        this._expectedValue = expectedValue;
        this._actualValue = actualValue;
        this._severity = severity;

        Object.freeze(this);
    }

    get constraintId() {
        return this._constraintId;
    }

    get featureName() {
        return this._featureName;
    }

    get expectedValue() {
        return this._expectedValue;
    }

    get actualValue() {
        return this._actualValue;
    }

    get severity() {
        return this._severity;
    }

    /**
     * Creates a violation from a constraint evaluation result.
     * @param {Object} constraint - The constraint object
     * @param {number} actualValue - The actual value
     * @returns {Violation|null}
     */
    static fromConstraint(constraint, actualValue) {
        const { id, feature, operator, threshold } = constraint;
        
        let isViolated = false;
        let severity = 0;

        if (operator === '>=') {
            if (actualValue < threshold) {
                isViolated = true;
                const diff = threshold - actualValue;
                severity = Math.min(1, diff / threshold);
            }
        } else if (operator === '<=') {
            if (actualValue > threshold) {
                isViolated = true;
                const diff = actualValue - threshold;
                severity = Math.min(1, diff / (1 - threshold));
            }
        } else if (operator === '==') {
            const tolerance = 0.1;
            if (Math.abs(actualValue - threshold) > tolerance) {
                isViolated = true;
                severity = Math.min(1, Math.abs(actualValue - threshold));
            }
        }

        if (!isViolated) {
            return null;
        }

        return new Violation(id, feature, threshold, actualValue, severity);
    }
}
