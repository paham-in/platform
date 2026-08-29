//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'user_admin_update_email_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class UserAdminUpdateEmailResponse {
  /// Returns a new [UserAdminUpdateEmailResponse] instance.
  UserAdminUpdateEmailResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is UserAdminUpdateEmailResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory UserAdminUpdateEmailResponse.fromJson(Map<String, dynamic> json) => _$UserAdminUpdateEmailResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UserAdminUpdateEmailResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

