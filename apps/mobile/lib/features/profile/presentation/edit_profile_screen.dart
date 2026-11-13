import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/responsive_card_container.dart';
import '../models/profile_model.dart';
import '../services/profile_api_service.dart';

class EditProfileScreen extends StatefulWidget {
  final UserProfileModel? initialProfile;

  const EditProfileScreen({super.key, this.initialProfile});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final ProfileApiService _profileService = ProfileApiService();

  late TextEditingController _nameController;
  late TextEditingController _bioController;
  late TextEditingController _occupationController;
  late TextEditingController _companyController;
  late TextEditingController _cityController;
  late TextEditingController _localityController;
  late TextEditingController _budgetMinController;
  late TextEditingController _budgetMaxController;

  late DateTime _selectedDob;
  late String _selectedGender;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final p = widget.initialProfile;
    _nameController = TextEditingController(text: p?.displayName ?? '');
    _bioController = TextEditingController(text: p?.bio ?? '');
    _occupationController = TextEditingController(text: p?.occupation ?? '');
    _companyController = TextEditingController(text: p?.companyOrCollege ?? '');
    _cityController = TextEditingController(text: p?.city ?? '');
    _localityController = TextEditingController(text: p?.preferredLocality ?? '');
    _budgetMinController =
        TextEditingController(text: (p?.budgetMin ?? 10000).toString());
    _budgetMaxController =
        TextEditingController(text: (p?.budgetMax ?? 20000).toString());

    _selectedDob = p?.dateOfBirth ?? DateTime(2000, 1, 1);
    _selectedGender = p?.gender ?? 'MALE';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    _occupationController.dispose();
    _companyController.dispose();
    _cityController.dispose();
    _localityController.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    super.dispose();
  }

  Future<void> _pickDateOfBirth() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDob,
      firstDate: DateTime(1950),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.neonYellow,
              onPrimary: Colors.black,
              surface: AppTheme.surface,
              onSurface: AppTheme.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _selectedDob = picked);
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final minBudget = int.tryParse(_budgetMinController.text.trim()) ?? 0;
    final maxBudget = int.tryParse(_budgetMaxController.text.trim()) ?? 0;

    if (minBudget > maxBudget) {
      setState(() {
        _errorMessage = 'Minimum budget cannot be greater than maximum budget';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final payload = {
      'displayName': _nameController.text.trim(),
      'dateOfBirth': _selectedDob.toIso8601String().split('T')[0],
      'gender': _selectedGender,
      'bio': _bioController.text.trim().isNotEmpty
          ? _bioController.text.trim()
          : null,
      'occupation': _occupationController.text.trim().isNotEmpty
          ? _occupationController.text.trim()
          : null,
      'companyOrCollege': _companyController.text.trim().isNotEmpty
          ? _companyController.text.trim()
          : null,
      'budgetMin': minBudget,
      'budgetMax': maxBudget,
      'city': _cityController.text.trim(),
      'preferredLocality': _localityController.text.trim().isNotEmpty
          ? _localityController.text.trim()
          : null,
    };

    final res = await _profileService.upsertProfile(payload);

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (res.success) {
      Navigator.of(context).pop(true);
    } else {
      setState(() {
        _errorMessage = res.message.isNotEmpty
            ? res.message
            : 'Failed to update profile';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.initialProfile != null ? 'Edit Profile' : 'Create Profile'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: ResponsiveCardContainer(
            maxWidth: 580,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Profile Details',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Provide your details so flatmates know who they will be sharing a flat with.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 18),
                  if (_errorMessage != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.pink.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.pink),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: AppTheme.pink, fontSize: 13),
                      ),
                    ),

                  // Display Name
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name *',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) {
                        return 'Please enter your name';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Date of Birth & Gender Row
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: _pickDateOfBirth,
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Date of Birth *',
                              prefixIcon: Icon(Icons.calendar_today_outlined),
                            ),
                            child: Text(
                              '${_selectedDob.day.toString().padLeft(2, '0')}/${_selectedDob.month.toString().padLeft(2, '0')}/${_selectedDob.year}',
                              style: const TextStyle(color: AppTheme.textPrimary),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _selectedGender,
                          isExpanded: true,
                          decoration: const InputDecoration(
                            labelText: 'Gender *',
                            prefixIcon: Icon(Icons.transgender),
                          ),
                          dropdownColor: AppTheme.surface,
                          items: const [
                            DropdownMenuItem(value: 'MALE', child: Text('Male')),
                            DropdownMenuItem(value: 'FEMALE', child: Text('Female')),
                            DropdownMenuItem(value: 'NON_BINARY', child: Text('Non-Binary')),
                            DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedGender = val);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // City & Locality
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _cityController,
                          decoration: const InputDecoration(
                            labelText: 'City *',
                            prefixIcon: Icon(Icons.location_city),
                          ),
                          validator: (val) => val == null || val.trim().isEmpty
                              ? 'City required'
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _localityController,
                          decoration: const InputDecoration(
                            labelText: 'Preferred Locality',
                            prefixIcon: Icon(Icons.place_outlined),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Budget Range
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _budgetMinController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Min Budget (₹) *',
                            prefixIcon: Icon(Icons.currency_rupee),
                          ),
                          validator: (val) {
                            if (val == null || val.isEmpty) return 'Min required';
                            if (int.tryParse(val) == null) return 'Enter number';
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _budgetMaxController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Max Budget (₹) *',
                            prefixIcon: Icon(Icons.currency_rupee),
                          ),
                          validator: (val) {
                            if (val == null || val.isEmpty) return 'Max required';
                            if (int.tryParse(val) == null) return 'Enter number';
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Occupation & Company
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _occupationController,
                          decoration: const InputDecoration(
                            labelText: 'Occupation',
                            prefixIcon: Icon(Icons.work_outline),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _companyController,
                          decoration: const InputDecoration(
                            labelText: 'Company / College',
                            prefixIcon: Icon(Icons.business_outlined),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Bio
                  TextFormField(
                    controller: _bioController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'About You (Bio)',
                      alignLabelWithHint: true,
                      prefixIcon: Padding(
                        padding: EdgeInsets.only(bottom: 40.0),
                        child: Icon(Icons.notes),
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleSave,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.neonYellow,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.black,
                              ),
                            )
                          : const Text(
                              'Save Profile',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
