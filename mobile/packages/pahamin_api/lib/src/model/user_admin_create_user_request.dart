//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_admin_create_user_request.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserAdminCreateUserRequest {
  /// Returns a new [UserAdminCreateUserRequest] instance.
  UserAdminCreateUserRequest({

     this.email,

     this.name,
  });

  @JsonKey(
    
    name: r'email',
    required: false,
    includeIfNull: false,
  )


  final String? email;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserAdminCreateUserRequest &&
      other.email == email &&
      other.name == name;

    @override
    int get hashCode =>
        email.hashCode +
        name.hashCode;

  factory UserAdminCreateUserRequest.fromJson(Map<String, dynamic> json) => _$UserAdminCreateUserRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UserAdminCreateUserRequestToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

