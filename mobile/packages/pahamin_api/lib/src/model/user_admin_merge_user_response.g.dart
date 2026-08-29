// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_admin_merge_user_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserAdminMergeUserResponse _$UserAdminMergeUserResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate(
  'UserAdminMergeUserResponse',
  json,
  ($checkedConvert) {
    final val = UserAdminMergeUserResponse(
      avatarUrl: $checkedConvert('avatar_url', (v) => v as String?),
      canManageMaterials: $checkedConvert(
        'can_manage_materials',
        (v) => v as bool?,
      ),
      canManageQuestionPackages: $checkedConvert(
        'can_manage_question_packages',
        (v) => v as bool?,
      ),
      createdAt: $checkedConvert('created_at', (v) => v as String?),
      email: $checkedConvert('email', (v) => v as String?),
      hasGoogle: $checkedConvert('has_google', (v) => v as bool?),
      hasPassword: $checkedConvert('has_password', (v) => v as bool?),
      id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
      name: $checkedConvert('name', (v) => v as String?),
      paymentStatus: $checkedConvert('payment_status', (v) => v as String?),
      roles: $checkedConvert(
        'roles',
        (v) => (v as List<dynamic>?)?.map((e) => e as String).toList(),
      ),
      subjects: $checkedConvert(
        'subjects',
        (v) => (v as List<dynamic>?)
            ?.map((e) => UserSubjectInfo.fromJson(e as Map<String, dynamic>))
            .toList(),
      ),
    );
    return val;
  },
  fieldKeyMap: const {
    'avatarUrl': 'avatar_url',
    'canManageMaterials': 'can_manage_materials',
    'canManageQuestionPackages': 'can_manage_question_packages',
    'createdAt': 'created_at',
    'hasGoogle': 'has_google',
    'hasPassword': 'has_password',
    'paymentStatus': 'payment_status',
  },
);

Map<String, dynamic> _$UserAdminMergeUserResponseToJson(
  UserAdminMergeUserResponse instance,
) => <String, dynamic>{
  'avatar_url': ?instance.avatarUrl,
  'can_manage_materials': ?instance.canManageMaterials,
  'can_manage_question_packages': ?instance.canManageQuestionPackages,
  'created_at': ?instance.createdAt,
  'email': ?instance.email,
  'has_google': ?instance.hasGoogle,
  'has_password': ?instance.hasPassword,
  'id': ?instance.id,
  'name': ?instance.name,
  'payment_status': ?instance.paymentStatus,
  'roles': ?instance.roles,
  'subjects': ?instance.subjects?.map((e) => e.toJson()).toList(),
};
