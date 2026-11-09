import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/responsive_card_container.dart';
import '../services/auth_api_service.dart';
import 'otp_screen.dart';

enum AuthTab { login, register }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authService = AuthApiService();

  AuthTab _currentTab = AuthTab.login;
  bool _isOtpMode = false;
  bool _isPasswordVisible = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _identifierController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handlePasswordLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await _authService.login(
      identifier: _identifierController.text.trim(),
      password: _passwordController.text,
    );

    setState(() {
      _isLoading = false;
    });

    if (response.success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Login successful! Welcome back.'),
          backgroundColor: AppTheme.success,
        ),
      );
      Navigator.of(context).pushReplacementNamed('/home');
    } else if (mounted) {
      setState(() {
        _errorMessage = response.message.isNotEmpty
            ? response.message
            : 'Login failed. Please check your credentials.';
      });
    }
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    if (_emailController.text.trim().isEmpty &&
        _phoneController.text.trim().isEmpty) {
      setState(() {
        _errorMessage = 'Please provide either an email or phone number.';
      });
      return;
    }

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() {
        _errorMessage = 'Passwords do not match.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await _authService.register(
      email: _emailController.text.trim().isNotEmpty
          ? _emailController.text.trim()
          : null,
      phoneNumber: _phoneController.text.trim().isNotEmpty
          ? _phoneController.text.trim()
          : null,
      password: _passwordController.text,
    );

    setState(() {
      _isLoading = false;
    });

    if (response.success && mounted) {
      final identifier = _emailController.text.trim().isNotEmpty
          ? _emailController.text.trim()
          : _phoneController.text.trim();

      if (identifier.isNotEmpty) {
        await _authService.sendOtp(
          identifier: identifier,
          purpose: 'VERIFICATION',
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Account created! Please verify your code.'),
              backgroundColor: AppTheme.mint,
            ),
          );
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (context) => OtpScreen(
                identifier: identifier,
                purpose: 'VERIFICATION',
              ),
            ),
          );
          return;
        }
      }
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    } else if (mounted) {
      setState(() {
        _errorMessage = response.message.isNotEmpty
            ? response.message
            : 'Registration failed. Please check your details.';
      });
    }
  }

  Future<void> _handleSendOtp() async {
    final identifier = _identifierController.text.trim();
    if (identifier.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter your phone number or email address.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await _authService.sendOtp(
      identifier: identifier,
      purpose: 'LOGIN',
    );

    setState(() {
      _isLoading = false;
    });

    if (response.success && mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => OtpScreen(
            identifier: identifier,
            purpose: 'LOGIN',
          ),
        ),
      );
    } else if (mounted) {
      setState(() {
        _errorMessage = response.message.isNotEmpty
            ? response.message
            : 'Failed to send OTP. Please try again.';
      });
    }
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Text(
        label,
        style: const TextStyle(
          color: AppTheme.textPrimary,
          fontSize: 13,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLogin = _currentTab == AuthTab.login;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: ResponsiveCardContainer(
            maxWidth: 440,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // 1. Top Segmented Pill Switcher (Matches Reference Image)
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1E1E),
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: AppTheme.border),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _currentTab = AuthTab.login;
                                _isOtpMode = false;
                                _errorMessage = null;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: isLogin
                                    ? AppTheme.neonYellow
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(24),
                              ),
                              child: Text(
                                'Log in',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: isLogin
                                      ? Colors.black
                                      : AppTheme.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _currentTab = AuthTab.register;
                                _isOtpMode = false;
                                _errorMessage = null;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: !isLogin
                                    ? AppTheme.neonYellow
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(24),
                              ),
                              child: Text(
                                'Create account',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: !isLogin
                                      ? Colors.black
                                      : AppTheme.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // 2. Headline & Subtitle (Matches Reference Image)
                  Text(
                    isLogin ? 'Welcome back' : 'Create an account',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.5,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isLogin
                        ? 'Log in to find your people & share your space.'
                        : 'Join verified flatmates and simplify shared living.',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Error Display Banner
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.error.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppTheme.error.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: AppTheme.error,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                  ],

                  // 3. Form Fields with clean labels above
                  if (isLogin) ...[
                    // Login Mode: Identifier + Password (or OTP)
                    _buildFieldLabel(_isOtpMode
                        ? 'Phone Number or Email'
                        : 'Email or Phone Number'),
                    TextFormField(
                      controller: _identifierController,
                      keyboardType: _isOtpMode
                          ? TextInputType.phone
                          : TextInputType.emailAddress,
                      decoration: InputDecoration(
                        hintText: _isOtpMode
                            ? '+919876543210'
                            : 'you@example.com / +919876543210',
                        prefixIcon: const Icon(Icons.person_outline,
                            color: AppTheme.textSecondary, size: 20),
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'Please enter your email or phone';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    if (!_isOtpMode) ...[
                      _buildFieldLabel('Password'),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: !_isPasswordVisible,
                        decoration: InputDecoration(
                          hintText: '••••••••',
                          prefixIcon: const Icon(Icons.lock_outline,
                              color: AppTheme.textSecondary, size: 20),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _isPasswordVisible
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                              color: AppTheme.textSecondary,
                              size: 20,
                            ),
                            onPressed: () {
                              setState(() {
                                _isPasswordVisible = !_isPasswordVisible;
                              });
                            },
                          ),
                        ),
                        validator: (val) {
                          if (val == null || val.isEmpty) {
                            return 'Please enter your password';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),
                    ] else ...[
                      const SizedBox(height: 12),
                    ],
                  ] else ...[
                    // Register Mode: Email + Phone + Password + Confirm
                    _buildFieldLabel('Email Address'),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        hintText: 'you@example.com',
                        prefixIcon: Icon(Icons.email_outlined,
                            color: AppTheme.textSecondary, size: 20),
                      ),
                    ),
                    const SizedBox(height: 14),

                    _buildFieldLabel('Phone Number'),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        hintText: '+919876543210',
                        prefixIcon: Icon(Icons.phone_outlined,
                            color: AppTheme.textSecondary, size: 20),
                      ),
                    ),
                    const SizedBox(height: 14),

                    _buildFieldLabel('Password'),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: !_isPasswordVisible,
                      decoration: InputDecoration(
                        hintText: 'Min 8 chars, 1 uppercase, 1 symbol',
                        prefixIcon: const Icon(Icons.lock_outline,
                            color: AppTheme.textSecondary, size: 20),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _isPasswordVisible
                                ? Icons.visibility_off
                                : Icons.visibility,
                            color: AppTheme.textSecondary,
                            size: 20,
                          ),
                          onPressed: () {
                            setState(() {
                              _isPasswordVisible = !_isPasswordVisible;
                            });
                          },
                        ),
                      ),
                      validator: (val) {
                        if (val == null || val.length < 8) {
                          return 'Password must be at least 8 characters';
                        }
                        if (!RegExp(r'[A-Z]').hasMatch(val)) {
                          return 'Password must contain at least 1 uppercase letter';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    _buildFieldLabel('Confirm Password'),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: !_isPasswordVisible,
                      decoration: const InputDecoration(
                        hintText: 'Re-enter your password',
                        prefixIcon: Icon(Icons.lock_clock_outlined,
                            color: AppTheme.textSecondary, size: 20),
                      ),
                      validator: (val) {
                        if (val != _passwordController.text) {
                          return 'Passwords do not match';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                  ],

                  // 4. Action Button (Matches Reference Image)
                  ElevatedButton(
                    onPressed: _isLoading
                        ? null
                        : (isLogin
                            ? (_isOtpMode
                                ? _handleSendOtp
                                : _handlePasswordLogin)
                            : _handleRegister),
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.black),
                            ),
                          )
                        : Text(
                            isLogin
                                ? (_isOtpMode ? 'Send OTP Code' : 'Log in')
                                : 'Create account',
                          ),
                  ),
                  const SizedBox(height: 18),

                  // 5. Centered Footer Links (Matches Reference Image)
                  if (isLogin) ...[
                    Center(
                      child: TextButton(
                        onPressed: () {
                          setState(() {
                            _isOtpMode = !_isOtpMode;
                            _errorMessage = null;
                          });
                        },
                        child: Text(
                          _isOtpMode
                              ? 'Log in with password instead'
                              : 'Log in with OTP code instead',
                          style: const TextStyle(
                            color: AppTheme.mint,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
