//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/user_subject_info.dart';
import 'package:json_annotation/json_annotation.dart';

part 'user_me_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserMeResponse {
  /// Returns a new [UserMeResponse] instance.
  UserMeResponse({

     this.avatarUrl,

     this.canManageMaterials,

     this.canManageQuestionPackages,

     this.email,

     this.id,

     this.name,

     this.paymentStatus,

     this.roles,

     this.subjects,
  });

  @JsonKey(
    
    name: r'avatar_url',
    required: false,
    includeIfNull: false,
  )


  final String? avatarUrl;



  @JsonKey(
    
    name: r'can_manage_materials',
    required: false,
    includeIfNull: false,
  )


  final bool? canManageMaterials;



  @JsonKey(
    
    name: r'can_manage_question_packages',
    required: false,
    includeIfNull: false,
  )


  final bool? canManageQuestionPackages;



  @JsonKey(
    
    name: r'email',
    required: false,
    includeIfNull: false,
  )


  final String? email;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'payment_status',
    required: false,
    includeIfNull: false,
  )


  final String? paymentStatus;



  @JsonKey(
    
    name: r'roles',
    required: false,
    includeIfNull: false,
  )


  final List<String>? roles;



  @JsonKey(
    
    name: r'subjects',
    required: false,
    includeIfNull: false,
  )


  final List<UserSubjectInfo>? subjects;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserMeResponse &&
      other.avatarUrl == avatarUrl &&
      other.canManageMaterials == canManageMaterials &&
      other.canManageQuestionPackages == canManageQuestionPackages &&
      other.email == email &&
      other.id == id &&
      other.name == name &&
      other.paymentStatus == paymentStatus &&
      other.roles == roles &&
      other.subjects == subjects;

    @override
    int get hashCode =>
        avatarUrl.hashCode +
        canManageMaterials.hashCode +
        canManageQuestionPackages.hashCode +
        email.hashCode +
        id.hashCode +
        name.hashCode +
        paymentStatus.hashCode +
        roles.hashCode +
        subjects.hashCode;

  factory UserMeResponse.fromJson(Map<String, dynamic> json) => _$UserMeResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UserMeResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

