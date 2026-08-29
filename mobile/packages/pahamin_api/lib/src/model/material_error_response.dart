//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'material_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class MaterialErrorResponse {
  /// Returns a new [MaterialErrorResponse] instance.
  MaterialErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is MaterialErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory MaterialErrorResponse.fromJson(Map<String, dynamic> json) => _$MaterialErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$MaterialErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

