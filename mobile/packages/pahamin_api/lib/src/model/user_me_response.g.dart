// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_me_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserMeResponse _$UserMeResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate(
      'UserMeResponse',
      json,
      ($checkedConvert) {
        final val = UserMeResponse(
          avatarUrl: $checkedConvert('avatar_url', (v) => v as String?),
          canManageMaterials: $checkedConvert(
            'can_manage_materials',
            (v) => v as bool?,
          ),
          canManageQuestionPackages: $checkedConvert(
            'can_manage_question_packages',
            (v) => v as bool?,
          ),
          email: $checkedConvert('email', (v) => v as String?),
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
                ?.map(
                  (e) => UserSubjectInfo.fromJson(e as Map<String, dynamic>),
                )
                .toList(),
          ),
        );
        return val;
      },
      fieldKeyMap: const {
        'avatarUrl': 'avatar_url',
        'canManageMaterials': 'can_manage_materials',
        'canManageQuestionPackages': 'can_manage_question_packages',
        'paymentStatus': 'payment_status',
      },
    );

Map<String, dynamic> _$UserMeResponseToJson(UserMeResponse instance) =>
    <String, dynamic>{
      'avatar_url': ?instance.avatarUrl,
      'can_manage_materials': ?instance.canManageMaterials,
      'can_manage_question_packages': ?instance.canManageQuestionPackages,
      'email': ?instance.email,
      'id': ?instance.id,
      'name': ?instance.name,
      'payment_status': ?instance.paymentStatus,
      'roles': ?instance.roles,
      'subjects': ?instance.subjects?.map((e) => e.toJson()).toList(),
    };
