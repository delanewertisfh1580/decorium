import { Violation } from './Violation.js';

/**
 * StyleConstraintEvaluator - Domain Service for evaluating style constraints.
 * Evaluates a room vector against a set of style constraints and returns violations.
 */
export class StyleConstraintEvaluator {
    /**
     * @param {Array<Object>} constraints - Array of constraint definitions
     */
    constructor(constraints) {
        if (!Array.isArray(constraints)) {
            throw new Error('Constraints must be an array');
        }

        this._constraints = Object.freeze([...constraints]);
    }

    get constraints() {
        return this._constraints;
    }

    /**
     * Evaluates all constraints against the room vector.
     * @param {Object} roomVector - The room feature vector
     * @returns {Array<Violation>} Array of violations (empty if all satisfied)
     */
    evaluate(roomVector) {
        if (!roomVector || typeof roomVector !== 'object') {
            throw new Error('Room vector must be a valid object');
        }

        const violations = [];

        for (const constraint of this._constraints) {
            const { feature, id } = constraint;
            
            if (!(feature in roomVector)) {
                // Skip constraints for features not present in the room vector
                continue;
            }

            const actualValue = roomVector[feature];
            const violation = Violation.fromConstraint(constraint, actualValue);

            if (violation !== null) {
                violations.push(violation);
            }
        }

        return Object.freeze(violations);
    }

    /**
     * Checks if all constraints are satisfied.
     * @param {Object} roomVector - The room feature vector
     * @returns {boolean} True if all constraints are satisfied
     */
    isSatisfied(roomVector) {
        const violations = this.evaluate(roomVector);
        return violations.length === 0;
    }

    /**
     * Gets a summary of evaluation results.
     * @param {Object} roomVector - The room feature vector
     * @returns {Object} Summary with total, satisfied, and violated counts
     */
    getSummary(roomVector) {
        const violations = this.evaluate(roomVector);
        const total = this._constraints.length;
        const violated = violations.length;
        const satisfied = total - violated;

        return Object.freeze({
            total,
            satisfied,
            violated,
            isPerfect: violated === 0
        });
    }
}
