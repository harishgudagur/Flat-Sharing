class TokenStorage {
  static final TokenStorage _instance = TokenStorage._internal();
  factory TokenStorage() => _instance;
  TokenStorage._internal();

  String? _accessToken;
  String? _refreshToken;
  Map<String, dynamic>? _currentUser;

  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  Map<String, dynamic>? get currentUser => _currentUser;

  bool get isAuthenticated => _accessToken != null && _accessToken!.isNotEmpty;

  void saveTokens({
    required String accessToken,
    required String refreshToken,
    Map<String, dynamic>? user,
  }) {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    if (user != null) {
      _currentUser = user;
    }
  }

  void saveUser(Map<String, dynamic> user) {
    _currentUser = user;
  }

  void clear() {
    _accessToken = null;
    _refreshToken = null;
    _currentUser = null;
  }
}

