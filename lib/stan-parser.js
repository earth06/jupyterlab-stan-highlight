import { ExternalTokenizer, ContextTracker } from '@lezer/lr';

// Stan language parser using Lezer grammar
// This is a simplified implementation focused on syntax highlighting

const stanKeywords = [
    'functions', 'data', 'transformed', 'parameters', 'model', 'generated', 'quantities',
    'int', 'real', 'complex', 'vector', 'array', 'simplex', 'unit_vector', 'ordered',
    'positive_ordered', 'row_vector', 'matrix', 'corr_matrix', 'cov_matrix',
    'cholesky_factor_cov', 'cholesky_factor_corr', 'void',
    'for', 'in', 'while', 'if', 'else', 'return',
    'lower', 'upper', 'offset', 'multiplier',
    'target', 'print', 'reject'
];

const stanDistributions = [
    'bernoulli', 'bernoulli_logit', 'beta', 'beta_binomial', 'binomial', 'binomial_logit',
    'categorical', 'categorical_logit', 'cauchy', 'chi_square', 'dirichlet', 'discrete_range',
    'double_exponential', 'exp_mod_normal', 'exponential', 'frechet', 'gamma', 'gaussian_dlm_obs',
    'gumbel', 'hypergeometric', 'inv_chi_square', 'inv_gamma', 'inv_wishart', 'lkj_corr',
    'lkj_corr_cholesky', 'logistic', 'lognormal', 'multi_gp', 'multi_gp_cholesky',
    'multi_normal', 'multi_normal_cholesky', 'multi_normal_prec', 'multi_student_t',
    'multinomial', 'multinomial_logit', 'neg_binomial', 'neg_binomial_2', 'neg_binomial_2_log',
    'normal', 'normal_id_glm', 'ordered_logistic', 'ordered_probit', 'pareto', 'pareto_type_2',
    'poisson', 'poisson_log', 'rayleigh', 'scaled_inv_chi_square', 'skew_double_exponential',
    'skew_normal', 'std_normal', 'student_t', 'uniform', 'von_mises', 'weibull', 'wiener', 'wishart'
];

const stanFunctions = [
    'Phi', 'Phi_approx', 'abs', 'acos', 'acosh', 'add_diag', 'algebra_solver', 'append_array',
    'append_col', 'append_row', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'beta', 'binary_log_loss',
    'block', 'cbrt', 'ceil', 'chol2inv', 'cholesky_decompose', 'choose', 'col', 'cols',
    'columns_dot_product', 'columns_dot_self', 'cos', 'cosh', 'cov_exp_quad', 'crossprod',
    'cumulative_sum', 'determinant', 'diag_matrix', 'diag_post_multiply', 'diag_pre_multiply',
    'diagonal', 'digamma', 'dims', 'distance', 'dot_product', 'dot_self', 'eigenvalues_sym',
    'eigenvectors_sym', 'erf', 'erfc', 'exp', 'exp2', 'expm1', 'fabs', 'falling_factorial',
    'fdim', 'floor', 'fma', 'fmax', 'fmin', 'fmod', 'gamma_p', 'gamma_q', 'generalized_inverse',
    'head', 'hmm_marginal', 'hypot', 'identity_matrix', 'inc_beta', 'int_step', 'integrate_1d',
    'integrate_ode', 'integrate_ode_adams', 'integrate_ode_bdf', 'integrate_ode_rk45', 'inv',
    'inv_Phi', 'inv_cloglog', 'inv_logit', 'inv_sqrt', 'inv_square', 'inverse', 'inverse_spd',
    'is_inf', 'is_nan', 'lambert_w0', 'lambert_wm1', 'lbeta', 'lchoose', 'ldexp', 'lgamma',
    'linspaced_array', 'linspaced_int_array', 'linspaced_row_vector', 'linspaced_vector',
    'lmgamma', 'lmultiply', 'log', 'log10', 'log1m', 'log1m_exp', 'log1m_inv_logit', 'log1p',
    'log1p_exp', 'log2', 'log_determinant', 'log_diff_exp', 'log_falling_factorial',
    'log_inv_logit', 'log_inv_logit_diff', 'log_mix', 'log_modified_bessel_first_kind',
    'log_rising_factorial', 'log_softmax', 'log_sum_exp', 'logit', 'map_rect', 'matrix_exp',
    'matrix_exp_multiply', 'matrix_power', 'max', 'mdivide_left_spd', 'mdivide_left_tri_low',
    'mdivide_right_spd', 'mdivide_right_tri_low', 'mean', 'min', 'modified_bessel_first_kind',
    'modified_bessel_second_kind', 'multiply_log', 'multiply_lower_tri_self_transpose',
    'num_elements', 'ode_adams', 'ode_adams_tol', 'ode_adjoint_tol_ctl', 'ode_bdf', 'ode_bdf_tol',
    'ode_ckrk', 'ode_ckrk_tol', 'ode_rk45', 'ode_rk45_tol', 'one_hot_array', 'one_hot_int_array',
    'one_hot_row_vector', 'one_hot_vector', 'ones_array', 'ones_int_array', 'ones_row_vector',
    'ones_vector', 'owens_t', 'pow', 'prod', 'qr_Q', 'qr_R', 'qr_thin_Q', 'qr_thin_R',
    'quad_form', 'quad_form_diag', 'quad_form_sym', 'quantile', 'rank', 'reduce_sum',
    'rep_array', 'rep_matrix', 'rep_row_vector', 'rep_vector', 'reverse', 'rising_factorial',
    'round', 'row', 'rows', 'rows_dot_product', 'rows_dot_self', 'scale_matrix_exp_multiply',
    'sd', 'segment', 'sin', 'singular_values', 'sinh', 'size', 'softmax', 'sort_asc', 'sort_desc',
    'sort_indices_asc', 'sort_indices_desc', 'sqrt', 'square', 'squared_distance', 'step',
    'sub_col', 'sub_row', 'sum', 'svd_U', 'svd_V', 'symmetrize_from_lower_tri', 'tail', 'tan',
    'tanh', 'tcrossprod', 'tgamma', 'to_array_1d', 'to_array_2d', 'to_matrix', 'to_row_vector',
    'to_vector', 'trace', 'trace_gen_quad_form', 'trace_quad_form', 'trigamma', 'trunc',
    'uniform_simplex', 'variance', 'zeros_array', 'zeros_int_array', 'zeros_row_vector'
];

// Simple tokenizer for Stan language
export const parser = {
    configure: (config) => ({
        parse: (input) => {
            // This is a simplified parser for syntax highlighting purposes
            // In a real implementation, you would use Lezer grammar
            return {
                length: input.length,
                cursor: () => ({
                    node: {
                        type: { name: 'Program' },
                        from: 0,
                        to: input.length
                    },
                    next: () => false
                })
            };
        }
    })
};
